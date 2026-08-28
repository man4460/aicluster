import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { DormReceiptPageClient } from "@/systems/dormitory/components/DormReceiptPageClient";
import type { DormReceiptPrintInput } from "@/systems/dormitory/lib/dorm-receipt-print";

type Props = {
  params: Promise<{ paymentId: string }>;
};

function parsePaymentId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default async function DormitoryReceiptPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { paymentId } = await params;
  const pid = parsePaymentId(paymentId);
  if (pid === null) notFound();

  const scope = await getDormitoryDataScope(session.sub);
  const payment = await prisma.splitBillPayment.findFirst({
    where: {
      id: pid,
      paymentStatus: "PAID",
      tenant: { room: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId } },
    },
    include: {
      tenant: true,
      bill: { include: { room: true } },
    },
  });
  if (!payment?.paidAt) notFound();

  const ownerId = payment.bill.room.ownerUserId;
  const dormRow = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId },
    },
  });

  const dormTitle = dormRow?.displayName?.trim() || "หอพัก";
  const periodMonth = `${payment.bill.billingYear}-${String(payment.bill.billingMonth).padStart(2, "0")}`;

  const printData: DormReceiptPrintInput = {
    dormTitle,
    logoUrl: dormRow?.logoUrl ?? null,
    taxId: dormRow?.taxId ?? null,
    address: dormRow?.address ?? null,
    caretakerPhone: dormRow?.caretakerPhone ?? null,
    roomNumber: payment.bill.room.roomNumber,
    tenantName: payment.tenant.name,
    periodMonth,
    amountBaht: Number(payment.amountToPay),
    paidAtIso: payment.paidAt.toISOString(),
    receiptNumber: payment.receiptNumber,
    note: payment.note,
  };

  return (
    <DormReceiptPageClient
      data={printData}
      defaultPaperSize={dormRow?.defaultPaperSize ?? "SLIP_58"}
    />
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DormPublicSlipForm } from "@/systems/dormitory/components/DormPublicSlipForm";

type Props = { params: Promise<{ token: string }> };

export default async function DormPublicSlipPage({ params }: Props) {
  const { token } = await params;
  const t = token?.trim() ?? "";
  if (t.length < 16) notFound();

  const payment = await prisma.splitBillPayment.findFirst({
    where: { publicProofToken: t, paymentStatus: "PENDING" },
    include: { tenant: true, bill: { include: { room: true } } },
  });
  if (!payment) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-lg font-semibold text-slate-900">ลิงก์ไม่ใช้งานได้</h1>
        <p className="mt-2 text-sm text-slate-600">รายการนี้ชำระแล้วหรือลิงก์ไม่ถูกต้อง</p>
      </div>
    );
  }

  const periodMonth = `${payment.bill.billingYear}-${String(payment.bill.billingMonth).padStart(2, "0")}`;
  const amount = Number(payment.amountToPay);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">แจ้งชำระค่าห้อง</p>
        <p className="mt-1 text-lg font-bold text-slate-900">ห้อง {payment.bill.room.roomNumber}</p>
        <p className="mt-1 text-sm text-slate-600">{payment.tenant.name}</p>
        <p className="mt-2 text-sm text-slate-500">งวด {periodMonth}</p>
        <p className="mt-3 text-2xl font-bold tabular-nums text-[#0000BF]">
          {amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท
        </p>
      </div>
      <DormPublicSlipForm token={t} />
    </div>
  );
}

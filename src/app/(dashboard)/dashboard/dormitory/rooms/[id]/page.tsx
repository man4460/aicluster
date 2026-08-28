import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { bangkokYearMonthYm } from "@/lib/dates/bangkok-calendar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { DormRoomDetailHeaderActions } from "@/systems/dormitory/components/DormRoomDetailHeaderActions";
import {
  RoomDetailClient,
  type DormOverdueRow,
  type DormRoomDetailJson,
} from "@/systems/dormitory/components/RoomDetailClient";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
} from "@/systems/dormitory/lib/compute";
import { refreshPendingSplitPaymentsForBill } from "@/systems/dormitory/lib/split-payments";
import { isDormUnpaidPaymentStatus } from "@/lib/dormitory/unpaid-payment-status";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import type { DormReceiptBrand } from "@/systems/dormitory/lib/dorm-receipt-print";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string; section?: string }> };

function parseRoomId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function billPeriodKey(b: { billingYear: number; billingMonth: number }): string {
  return `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`;
}

function parseFocusSection(raw: string | undefined): "meter" | "payment" | "tenants" | null {
  if (raw === "meter" || raw === "payment") return raw;
  if (raw === "tenants") return "tenants";
  return null;
}

export default async function DormitoryRoomDetailPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  const focusMonth =
    typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  const focusSection = parseFocusSection(sp.section);
  const roomId = parseRoomId(id);
  if (roomId === null) notFound();

  const scope = await getDormitoryDataScope(session.sub);
  const room = await prisma.room.findFirst({
    where: { id: roomId, ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    include: {
      tenants: { orderBy: { id: "asc" } },
      utilityBills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        include: { payments: true },
      },
    },
  });
  if (!room) notFound();

  const computeInputInitial = buildRoomComputeInput(room);
  const overdueBalanceLinesInitial = overdueLines(computeAllBalanceLines(computeInputInitial)).filter(
    (l) => l.roomId === String(room.id),
  );
  const billIdsNeedingRefresh = new Set<number>();
  for (const l of overdueBalanceLinesInitial) {
    const bill = room.utilityBills.find((b) => billPeriodKey(b) === l.month);
    if (!bill) continue;
    const payment = bill.payments.find(
      (p) => String(p.tenantId) === l.tenantId && isDormUnpaidPaymentStatus(p.paymentStatus),
    );
    if (!payment) billIdsNeedingRefresh.add(bill.id);
  }
  for (const billId of billIdsNeedingRefresh) {
    await refreshPendingSplitPaymentsForBill(billId);
  }

  let utilityBillsForRender = room.utilityBills;
  if (billIdsNeedingRefresh.size > 0) {
    const refreshedBills = await prisma.utilityBill.findMany({
      where: { id: { in: [...billIdsNeedingRefresh] } },
      include: { payments: true },
    });
    utilityBillsForRender = room.utilityBills.map((b) => {
      const refreshed = refreshedBills.find((x) => x.id === b.id);
      return refreshed ? { ...b, payments: refreshed.payments } : b;
    });
  }

  const roomForCompute = { ...room, utilityBills: utilityBillsForRender };

  const dormRow = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    },
  });
  const business = await getBusinessProfile(session.sub);
  const dormBrand: DormReceiptBrand = {
    dormTitle: business?.name?.trim() || dormRow?.displayName?.trim() || "หอพัก",
    logoUrl: business?.logoUrl ?? dormRow?.logoUrl ?? null,
    taxId: business?.taxId ?? dormRow?.taxId ?? null,
    address: business?.address ?? dormRow?.address ?? null,
    caretakerPhone: business?.contactPhone ?? dormRow?.caretakerPhone ?? null,
    defaultPaperSize: dormRow?.defaultPaperSize ?? "SLIP_58",
  };

  const paidPayments = await prisma.splitBillPayment.findMany({
    where: {
      tenant: { roomId: room.id },
      paymentStatus: "PAID",
      paidAt: { not: null },
    },
    orderBy: { paidAt: "desc" },
    take: 40,
    include: { tenant: true, bill: true },
  });

  const computeInput = buildRoomComputeInput(roomForCompute);
  const overdueBalanceLines = overdueLines(computeAllBalanceLines(computeInput)).filter(
    (l) => l.roomId === String(room.id),
  );
  const overdueRows: DormOverdueRow[] = overdueBalanceLines.map((l) => {
    const bill = utilityBillsForRender.find((b) => billPeriodKey(b) === l.month);
    const payment = bill?.payments.find(
      (p) => String(p.tenantId) === l.tenantId && isDormUnpaidPaymentStatus(p.paymentStatus),
    );
    return {
      tenantId: l.tenantId,
      tenantName: l.tenantName,
      month: l.month,
      balance: l.balance,
      billId: bill?.id ?? null,
      paymentId: payment?.id ?? null,
      paymentStatus: payment?.paymentStatus ?? null,
      proofSlipUrl: payment?.proofSlipUrl ?? null,
    };
  });

  const json: DormRoomDetailJson = {
    id: String(room.id),
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    floor: room.floor,
    basePrice: Number(room.basePrice),
    maxOccupants: room.maxOccupants,
    tenants: room.tenants.map((t) => ({
      id: String(t.id),
      name: t.name,
      phone: t.phone,
      idCard: t.idCard,
      status: t.status,
      checkInDate: t.checkInDate.toISOString().slice(0, 10),
    })),
    utilityBills: utilityBillsForRender.map((b) => ({
      id: b.id,
      periodMonth: `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`,
      waterMeterPrev: b.waterMeterPrev,
      waterMeterCurr: b.waterMeterCurr,
      waterPrice: Number(b.waterPrice),
      electricMeterPrev: b.electricMeterPrev,
      electricMeterCurr: b.electricMeterCurr,
      electricPrice: Number(b.electricPrice),
      fixedFees: b.fixedFees,
      totalRoomAmount: Number(b.totalRoomAmount),
      payments: b.payments.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        amountToPay: Number(p.amountToPay),
        paymentStatus: p.paymentStatus,
        proofSlipUrl: p.proofSlipUrl,
        proofUploadedAt: p.proofUploadedAt?.toISOString() ?? null,
      })),
    })),
    paidPayments: paidPayments.map((p) => ({
      id: String(p.id),
      tenantId: String(p.tenantId),
      periodMonth: `${p.bill.billingYear}-${String(p.bill.billingMonth).padStart(2, "0")}`,
      amountToPay: Number(p.amountToPay),
      paidAt: p.paidAt!.toISOString(),
      note: p.note,
      receiptNumber: p.receiptNumber,
    })),
  };

  const initialFocusSection =
    focusSection === "meter" || focusSection === "payment" ? focusSection : null;

  return (
    <DormPageStack>
      <DormPanelCard
        title={`ห้อง ${room.roomNumber}`}
        description={`${room.roomType} · ชั้น ${room.floor} · ค่าเช่า ${Number(room.basePrice).toLocaleString("th-TH")} บาท/เดือน`}
        action={
          <DormRoomDetailHeaderActions
            room={{
              id: String(room.id),
              roomNumber: room.roomNumber,
              floor: room.floor,
              roomType: room.roomType,
              basePrice: Number(room.basePrice),
              maxOccupants: room.maxOccupants,
              activeTenants: room.tenants.filter((t) => t.status === "ACTIVE").length,
            }}
          />
        }
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
      >
        <Suspense fallback={<p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>}>
          <RoomDetailClient
            key={`${room.id}-${room.updatedAt.toISOString()}`}
            room={json}
            dormBrand={dormBrand}
            overdueRows={overdueRows}
            initialPayMonth={focusMonth}
            initialBangkokYm={bangkokYearMonthYm()}
            initialFocusSection={initialFocusSection}
            initialSection={focusSection}
          />
        </Suspense>
      </DormPanelCard>
    </DormPageStack>
  );
}

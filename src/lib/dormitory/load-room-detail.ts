import { bangkokYearMonthYm } from "@/lib/dates/bangkok-calendar";
import { isDormUnpaidPaymentStatus } from "@/lib/dormitory/unpaid-payment-status";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { prisma } from "@/lib/prisma";
import type { DormOverdueRow, DormRoomDetailJson } from "@/systems/dormitory/components/RoomDetailClient";
import type { DormReceiptBrand } from "@/systems/dormitory/lib/dorm-receipt-print";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
} from "@/systems/dormitory/lib/compute";
import { refreshPendingSplitPaymentsForBill } from "@/systems/dormitory/lib/split-payments";

function billPeriodKey(b: { billingYear: number; billingMonth: number }): string {
  return `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`;
}

export type DormRoomDetailPayload = {
  room: DormRoomDetailJson;
  dormBrand: DormReceiptBrand;
  overdueRows: DormOverdueRow[];
  initialBangkokYm: string;
};

export async function loadDormRoomDetailPayload(
  ownerUserId: string,
  trialSessionId: string,
  roomId: number,
): Promise<DormRoomDetailPayload | null> {
  const room = await prisma.room.findFirst({
    where: { id: roomId, ownerUserId, trialSessionId },
    include: {
      tenants: { orderBy: { id: "asc" } },
      utilityBills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        include: { payments: true },
      },
    },
  });
  if (!room) return null;

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
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
  });
  const business = await getBusinessProfile(ownerUserId);
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
      checkOutDate: t.checkOutDate?.toISOString().slice(0, 10) ?? null,
      bookingDepositBaht: Number(t.bookingDepositBaht),
      securityDepositBaht: Number(t.securityDepositBaht),
      depositPaymentMethod: t.depositPaymentMethod,
      damageDeductionBaht: t.damageDeductionBaht != null ? Number(t.damageDeductionBaht) : null,
      securityRefundBaht: t.securityRefundBaht != null ? Number(t.securityRefundBaht) : null,
      moveOutNote: t.moveOutNote,
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
      paymentMethod: p.paymentMethod,
    })),
  };

  return {
    room: json,
    dormBrand,
    overdueRows,
    initialBangkokYm: bangkokYearMonthYm(),
  };
}

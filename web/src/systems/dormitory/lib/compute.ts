import { bangkokMonthKey } from "@/lib/time/bangkok";
import { computeUtilityTotalRoomAmount } from "@/systems/dormitory/lib/utility-math";

export type FixedCostItem = { label: string; amount: number };

export function parseFixedCosts(json: unknown): FixedCostItem[] {
  if (json == null) return [];
  if (Array.isArray(json)) {
    return json
      .filter((x): x is { label?: unknown; amount?: unknown } => Boolean(x) && typeof x === "object")
      .map((x) => ({
        label: String(x.label ?? ""),
        amount: Number(x.amount) || 0,
      }))
      .filter((x) => x.label.length > 0);
  }
  if (typeof json === "object") {
    return Object.entries(json as Record<string, unknown>).map(([label, v]) => ({
      label,
      amount: Number(v) || 0,
    }));
  }
  return [];
}

/** ตัวช่วย UI — พารามิเตอร์ชื่อเดิมจากมิเตอร์น้ำ/ไฟ */
export function utilityBillRoomTotal(input: {
  waterPrev: number;
  waterCurr: number;
  waterRatePerUnit: number;
  electricPrev: number;
  electricCurr: number;
  electricRatePerUnit: number;
  fixedCostsJson: unknown;
}): number {
  const fromRows = Array.isArray(input.fixedCostsJson)
    ? input.fixedCostsJson
    : parseFixedCosts(input.fixedCostsJson);
  const fixedFeesJson =
    Array.isArray(input.fixedCostsJson) && input.fixedCostsJson.length > 0
      ? input.fixedCostsJson
      : fromRows.length > 0
        ? fromRows
        : typeof input.fixedCostsJson === "object" && input.fixedCostsJson !== null
          ? input.fixedCostsJson
          : null;
  return computeUtilityTotalRoomAmount({
    waterMeterPrev: Math.round(input.waterPrev),
    waterMeterCurr: Math.round(input.waterCurr),
    electricMeterPrev: Math.round(input.electricPrev),
    electricMeterCurr: Math.round(input.electricCurr),
    waterPrice: input.waterRatePerUnit,
    electricPrice: input.electricRatePerUnit,
    fixedFeesJson,
  });
}

export function buildRoomComputeInput(room: {
  id: number;
  roomNumber: string;
  basePrice: { toString(): string } | number;
  maxOccupants: number;
  createdAt: Date;
  tenants: Array<{ id: number; name: string; status: "ACTIVE" | "MOVED_OUT" }>;
  utilityBills: Array<{
    billingYear: number;
    billingMonth: number;
    totalRoomAmount: { toString(): string } | number;
    payments: Array<{
      tenantId: number;
      paymentStatus: "PENDING" | "PAID" | "OVERDUE";
      amountToPay: { toString(): string } | number;
    }>;
  }>;
}): RoomComputeInput {
  return {
    id: String(room.id),
    roomNumber: room.roomNumber,
    basePrice: Number(room.basePrice),
    maxOccupants: room.maxOccupants,
    createdAt: room.createdAt,
    tenants: room.tenants.map((t) => ({
      id: String(t.id),
      fullName: t.name,
      isActive: t.status === "ACTIVE",
    })),
    monthlyBills: room.utilityBills.map((b) => ({
      periodMonth: `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`,
      totalRoomAmount: Number(b.totalRoomAmount),
      payments: b.payments.map((p) => ({
        tenantId: String(p.tenantId),
        paymentStatus: p.paymentStatus,
        amountToPay: Number(p.amountToPay),
      })),
    })),
  };
}

export type TenantRow = { id: string; fullName: string; isActive: boolean };

export type MonthlyBillSnapshot = {
  periodMonth: string;
  totalRoomAmount: number;
  payments: Array<{
    tenantId: string;
    paymentStatus: "PENDING" | "PAID" | "OVERDUE";
    amountToPay: number;
  }>;
};

export type RoomComputeInput = {
  id: string;
  roomNumber: string;
  basePrice: number;
  maxOccupants: number;
  createdAt: Date;
  tenants: TenantRow[];
  monthlyBills: MonthlyBillSnapshot[];
};

export type BalanceLine = {
  roomId: string;
  roomNumber: string;
  tenantId: string;
  tenantName: string;
  month: string;
  due: number;
  paid: number;
  balance: number;
  overdue: boolean;
};

function* monthsFromTo(startYm: string, endYm: string): Generator<string> {
  const [sy, sm] = startYm.split("-").map((x) => Number(x));
  const [ey, em] = endYm.split("-").map((x) => Number(x));
  let y = sy;
  let m = sm;
  const endN = ey * 12 + em;
  while (y * 12 + m <= endN) {
    yield `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

export function computeAllBalanceLines(room: RoomComputeInput, now = new Date()): BalanceLine[] {
  const currentMonth = bangkokMonthKey(now);
  const startMonth = bangkokMonthKey(room.createdAt);
  const active = room.tenants.filter((t) => t.isActive);
  const n = active.length;
  const lines: BalanceLine[] = [];

  if (n === 0) return lines;

  const rentShare = room.basePrice / n;

  for (const month of monthsFromTo(startMonth, currentMonth)) {
    const snap = room.monthlyBills.find((b) => b.periodMonth === month);
    const utilShare = snap ? snap.totalRoomAmount / n : 0;

    for (const t of active) {
      const pm = snap?.payments.find((p) => p.tenantId === t.id);
      const due = pm ? pm.amountToPay : rentShare + utilShare;
      const paid = pm && pm.paymentStatus === "PAID" ? pm.amountToPay : 0;
      const balance = due - paid;
      const overdue = month < currentMonth && balance > 0.005;
      if (balance > 0.005 || paid > 0) {
        lines.push({
          roomId: room.id,
          roomNumber: room.roomNumber,
          tenantId: t.id,
          tenantName: t.fullName,
          month,
          due: Math.round(due * 100) / 100,
          paid: Math.round(paid * 100) / 100,
          balance: Math.round(balance * 100) / 100,
          overdue,
        });
      }
    }
  }

  return lines;
}

export function overdueLines(lines: BalanceLine[]): BalanceLine[] {
  return lines.filter((l) => l.overdue && l.balance > 0.005);
}

/**
 * สถานะการเงินระดับห้อง (งวดปัจจุบันเขตไทย) — บิลมิเตอร์ผูกกับห้อง แล้วหารให้ผู้พัก ACTIVE
 * "ชำระครบ" เมื่อทุกคนที่ ACTIVE มีแถว payments ของงวดนี้เป็น PAID
 */
export type RoomBillingUiStatus =
  | "vacant"
  | "overdue"
  | "paid_complete"
  | "payment_pending"
  | "meter_needed";

export function roomBillingUiStatus(room: RoomComputeInput, now = new Date()): RoomBillingUiStatus {
  const currentMonth = bangkokMonthKey(now);
  const active = room.tenants.filter((t) => t.isActive);
  if (active.length === 0) return "vacant";

  const lines = computeAllBalanceLines(room, now);
  if (overdueLines(lines).some((l) => l.roomId === room.id)) return "overdue";

  const snap = room.monthlyBills.find((b) => b.periodMonth === currentMonth);
  if (!snap) return "meter_needed";

  for (const t of active) {
    const p = snap.payments.find((x) => x.tenantId === t.id);
    if (!p || p.paymentStatus !== "PAID") return "payment_pending";
  }
  return "paid_complete";
}

export type RoomStatusKind = "vacant" | "partial" | "full" | "overdue";

export function roomStatusKind(
  room: Pick<RoomComputeInput, "id" | "maxOccupants" | "tenants">,
  lines: BalanceLine[],
): RoomStatusKind {
  const n = room.tenants.filter((t) => t.isActive).length;
  const hasOverdue = overdueLines(lines).some((l) => l.roomId === room.id);
  if (hasOverdue) return "overdue";
  if (n === 0) return "vacant";
  if (n >= room.maxOccupants) return "full";
  return "partial";
}

export function rentPerTenant(basePrice: number, activeTenantCount: number): number {
  const n = activeTenantCount;
  if (n <= 0) return 0;
  return Math.round((basePrice / n) * 100) / 100;
}

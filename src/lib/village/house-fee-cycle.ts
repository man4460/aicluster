import type { VillageFeeRowStatus, VillageHouseFeeCycle } from "@/generated/prisma/client";

/** ยอดเรียกเก็บในเดือน YYYY-MM จากอัตราต่อเดือน (override หรือมาตรฐาน) */
export function villageFeeAmountDueForYearMonth(
  cycle: VillageHouseFeeCycle,
  yearMonth: string,
  monthlyRateBaht: number,
): number {
  const m = Number.parseInt(yearMonth.slice(5, 7), 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return 0;
  const rate = Math.max(0, monthlyRateBaht);
  switch (cycle) {
    case "MONTHLY":
      return rate;
    case "SEMI_ANNUAL":
      return m === 1 || m === 7 ? rate * 6 : 0;
    case "ANNUAL":
      return m === 1 ? rate * 12 : 0;
    default:
      return rate;
  }
}

export function villageFeeRowStatusAfterRegenerate(amountDue: number, amountPaid: number): VillageFeeRowStatus {
  if (amountDue <= 0) return "WAIVED";
  if (amountPaid >= amountDue) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "PENDING";
}

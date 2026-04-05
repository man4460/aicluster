import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";

/** กะสูงสุดต่อโลเคชัน */
export const ATTENDANCE_MAX_SHIFTS_PER_LOCATION = 5 as const;

/** โลเคชันจุดเช็ค — คงที่ 1 แห่ง */
export const ATTENDANCE_MAX_LOCATIONS = 1 as const;

export type AttendancePlanQuota = {
  label: string;
  /** ไม่จำกัดจำนวนพนักงานในรายชื่อ */
  maxRosterActive: number | null;
  maxLocations: number;
  maxShiftsPerLocation: number;
};

/**
 * นโยบายเช็คชื่อ: ไม่จำกัดจำนวนคน · 1 โลเคชัน · กะไม่เกิน 5
 * (label อ้างอิงแพ็กเพื่อแสดงใน UI เท่านั้น)
 */
export function getAttendancePlanQuota(
  subscriptionType: SubscriptionType,
  subscriptionTier: SubscriptionTier,
): AttendancePlanQuota {
  let label = "เช็คอินอัจฉริยะ";
  if (subscriptionType === "DAILY") label = "สายรายวัน";
  else if (subscriptionTier === "TIER_199") label = "แพ็กเหมา · กลุ่ม 1";
  else if (subscriptionTier === "TIER_299") label = "แพ็กเหมา · กลุ่ม 2";
  else if (subscriptionTier === "TIER_399") label = "แพ็กเหมา · กลุ่ม 3";
  else if (subscriptionTier === "TIER_499") label = "แพ็กเหมา · กลุ่ม 4";
  else if (subscriptionTier === "TIER_599") label = "แพ็กเหมา · กลุ่ม 5";
  else if (subscriptionTier === "NONE") label = "แพ็กเหมา (ยังไม่เลือกระดับ)";

  return {
    label,
    maxRosterActive: null,
    maxLocations: ATTENDANCE_MAX_LOCATIONS,
    maxShiftsPerLocation: ATTENDANCE_MAX_SHIFTS_PER_LOCATION,
  };
}

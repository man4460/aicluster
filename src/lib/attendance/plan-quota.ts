import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";

/** กะสูงสุดต่อโลเคชัน */
export const ATTENDANCE_MAX_SHIFTS_PER_LOCATION = 5 as const;

export type AttendancePlanQuotaOptions = {
  /** สมัครโมดูลเช็คอินแบบรายเดือน 199 บาท (ไม่ผ่านแพ็กเหมา) */
  hasModuleMonthly199?: boolean;
  /** ชุดทดลอง sandbox */
  isTrialSandbox?: boolean;
};

export type AttendancePlanQuota = {
  label: string;
  /** ไม่จำกัดจำนวนพนักงานในรายชื่อ */
  maxRosterActive: number | null;
  /** `null` = ไม่จำกัดจำนวนจุดเช็ค */
  maxLocations: number | null;
  maxShiftsPerLocation: number;
};

/** จำนวนจุดเช็คตามแพ็กรายเดือน (แพ็กเหมา MAWELL) */
export function getAttendanceMaxLocationsForTier(
  subscriptionType: SubscriptionType,
  subscriptionTier: SubscriptionTier,
  options?: AttendancePlanQuotaOptions,
): number | null {
  if (options?.isTrialSandbox) return 5;

  if (subscriptionType === "BUFFET") {
    switch (subscriptionTier) {
      case "TIER_199":
        return 5;
      case "TIER_299":
        return 20;
      case "TIER_399":
        return 40;
      case "TIER_499":
      case "TIER_599":
        return null;
      default:
        return 1;
    }
  }

  if (options?.hasModuleMonthly199) return 5;

  return 1;
}

export function formatAttendanceLocationLimit(maxLocations: number | null): string {
  return maxLocations == null ? "ไม่จำกัด" : String(maxLocations);
}

export function attendanceLocationQuotaError(maxLocations: number): string {
  return `แพ็กปัจจุบันรองรับได้ ${maxLocations} จุดเช็ค — อัปเกรดแพ็กรายเดือนเพื่อเพิ่มจุด`;
}

/**
 * นโยบายเช็คชื่อ: ไม่จำกัดจำนวนคน · จุดเช็คตามแพ็ก · กะไม่เกิน 5
 */
export function getAttendancePlanQuota(
  subscriptionType: SubscriptionType,
  subscriptionTier: SubscriptionTier,
  options?: AttendancePlanQuotaOptions,
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
    maxLocations: getAttendanceMaxLocationsForTier(subscriptionType, subscriptionTier, options),
    maxShiftsPerLocation: ATTENDANCE_MAX_SHIFTS_PER_LOCATION,
  };
}

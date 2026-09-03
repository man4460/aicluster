import { hasMonthly199ForModule, type UserAccessFields } from "@/lib/modules/access";
import { LMS_MODULE_SLUG } from "@/lib/modules/config";

/** โควตาผู้เรียนสายรายวัน (ต่อสถาบัน / owner + trial) */
export const LMS_LEARNER_QUOTA_DAILY = 100;

/**
 * @deprecated ใช้ `LMS_LEARNER_QUOTA_DAILY` หรือ `resolveLmsLearnerQuotaMax`
 * คงชื่อเดิมไว้ให้ import เก่าไม่พัง = โควต้ารายวัน
 */
export const LMS_LEARNER_QUOTA = LMS_LEARNER_QUOTA_DAILY;

export type LmsLearnerQuota = {
  used: number;
  /** `null` = ไม่จำกัด (แพ็กเดือน / แอดมิน) */
  max: number | null;
};

/** โควตาผู้เรียนตามแพ็ก — รายวัน 100 · รายเดือน (199) ไม่จำกัด */
export function resolveLmsLearnerQuotaMax(
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
): number | null {
  if (hasMonthly199ForModule(access, LMS_MODULE_SLUG)) return null;
  return LMS_LEARNER_QUOTA_DAILY;
}

export function isLmsLearnerQuotaFull(quota: LmsLearnerQuota): boolean {
  if (quota.max == null) return false;
  return quota.used >= quota.max;
}

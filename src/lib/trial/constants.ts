/** ค่าคงที่สำหรับข้อมูล production — ไม่ใช่แถว TrialSession */
export const TRIAL_PROD_SCOPE = "prod";

export function trialSessionDaysDefault(): number {
  const raw = process.env.MODULE_TRIAL_DAYS ?? process.env.TRIAL_SESSION_DAYS;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 1 && n <= 90) return n;
  return 7;
}

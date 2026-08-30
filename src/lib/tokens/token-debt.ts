/**
 * หนี้โทเคนสายรายวัน — หักได้แม้ยอดไม่พอ (ติดลบ)
 * ถ้าติดลบถึงเกณฑ์นี้ ล็อคบัญชีจนกว่าจะชำระค้าง (เติมจนยอด ≥ 0)
 */
export const TOKEN_DEBT_LOCK_LIMIT = 100;

/** 1 บาท = 1 โทเคน */
export const MODULE_MONTHLY_199_TOKEN_COST = 199;

/** โทเคนที่หักตอนกดสมัครสายรายวัน (1 บาท/วัน) */
export const MODULE_DAILY_SUBSCRIBE_TOKEN_COST = 1;

export function isTokenDebtLocked(tokens: number): boolean {
  return tokens <= -TOKEN_DEBT_LOCK_LIMIT;
}

/** จำนวนบาท/โทเคนที่ต้องเติมเพื่อปลดล็อค (ยอดติดลบ → 0) */
export function tokenArrearsToClear(tokens: number): number {
  if (tokens >= 0) return 0;
  return Math.abs(tokens);
}

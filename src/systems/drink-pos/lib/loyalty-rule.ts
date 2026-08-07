/** กฎสะสมคะแนน POS เครื่องดื่ม — ฟังก์ชันบริสุทธิ์ */

export type DrinkPosLoyaltySettingsDto = {
  enabled: boolean;
  baht_per_point: number;
  points_per_unit: number;
};

export type DrinkPosLoyaltyRewardDto = {
  id: number;
  title: string;
  product_id: string | null;
  points_cost: number;
  sort_order: number;
  is_active: boolean;
  /** รูปจากสินค้าที่ผูก (ถ้ามี) */
  image_url?: string;
};

export type DrinkPosLoyaltyMemberDto = {
  id: string;
  phone: string;
  customer_name: string | null;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
};

export function clampBahtPerPoint(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.max(1, Math.min(Math.floor(n), 1_000_000));
}

export function clampPointsPerUnit(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(Math.floor(n), 1000));
}

export function clampPointsCost(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(Math.floor(n), 1_000_000));
}

export function calcDrinkPosPointsEarned(
  totalBaht: number,
  bahtPerPoint: number,
  pointsPerUnit: number,
): number {
  const baht = Math.max(0, Math.floor(totalBaht));
  const per = clampBahtPerPoint(bahtPerPoint);
  const unit = clampPointsPerUnit(pointsPerUnit);
  if (baht < per) return 0;
  return Math.floor(baht / per) * unit;
}

export function formatDrinkPosLoyaltyEarnRule(bahtPerPoint: number, pointsPerUnit: number): string {
  const b = clampBahtPerPoint(bahtPerPoint);
  const p = clampPointsPerUnit(pointsPerUnit);
  if (p === 1) return `ทุกๆ ${b.toLocaleString("th-TH")} บาท ได้ 1 คะแนน`;
  return `ทุกๆ ${b.toLocaleString("th-TH")} บาท ได้ ${p.toLocaleString("th-TH")} คะแนน`;
}

export function normalizeDrinkPosMemberPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export function isDrinkPosMemberPhoneReady(raw: string): boolean {
  const n = normalizeDrinkPosMemberPhone(raw).length;
  return n >= 9 && n <= 10;
}

/** @deprecated ใช้ formatDrinkPosLoyaltyEarnRule */
export function formatDrinkPosLoyaltyRule(stampsPerReward: number, rewardTitle: string): string {
  const n = Math.max(1, Math.min(Math.floor(stampsPerReward) || 10, 30));
  const title = rewardTitle.trim() || "ของรางวัล";
  return `ซื้อ ${n} ครั้ง แลก${title}`;
}

/** @deprecated */
export function clampDrinkPosStampsPerReward(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.max(1, Math.min(Math.floor(value), 30));
}

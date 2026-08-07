/** กฎสะสมคะแนน — ฟังก์ชันบริสุทธิ์ (ใช้ฝั่ง client ได้) */

export type BuildingPosLoyaltySettingsDto = {
  enabled: boolean;
  baht_per_point: number;
  points_per_unit: number;
};

export type BuildingPosLoyaltyRewardDto = {
  id: number;
  title: string;
  menu_item_id: number | null;
  points_cost: number;
  sort_order: number;
  is_active: boolean;
  /** รูปจากเมนูที่ผูก (ถ้ามี) */
  image_url?: string;
};

export type BuildingPosLoyaltyMemberDto = {
  id: number;
  phone: string;
  customer_name: string;
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

/** คะแนนที่ได้จากยอดชำระ — floor(ยอด / bahtPerPoint) * pointsPerUnit */
export function calcBuildingPosPointsEarned(
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

export function formatBuildingPosLoyaltyEarnRule(bahtPerPoint: number, pointsPerUnit: number): string {
  const b = clampBahtPerPoint(bahtPerPoint);
  const p = clampPointsPerUnit(pointsPerUnit);
  if (p === 1) return `ทุกๆ ${b.toLocaleString("th-TH")} บาท ได้ 1 คะแนน`;
  return `ทุกๆ ${b.toLocaleString("th-TH")} บาท ได้ ${p.toLocaleString("th-TH")} คะแนน`;
}

/** คีย์สมาชิกสะสมคะแนน — เก็บเป็นตัวเลขล้วน (ใช้ฝั่ง client ได้) */
export function normalizeBuildingPosMemberPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export function isBuildingPosMemberPhoneReady(raw: string): boolean {
  const n = normalizeBuildingPosMemberPhone(raw).length;
  return n >= 9 && n <= 10;
}

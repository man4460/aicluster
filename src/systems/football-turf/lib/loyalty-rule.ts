/** กฎสะสมคะแนนสนามฟุตบอล — ฟังก์ชันบริสุทธิ์ (ใช้ฝั่ง client ได้) */

export type FootballTurfLoyaltySettingsDto = {
  enabled: boolean;
  baht_per_point: number;
  points_per_unit: number;
};

export type FootballTurfLoyaltyRewardDto = {
  id: number;
  title: string;
  points_cost: number;
  sort_order: number;
  is_active: boolean;
  image_url?: string;
};

export type FootballTurfLoyaltyMemberDto = {
  id: number;
  phone: string;
  customer_name: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
};

export type FootballTurfCustomerUsageStats = {
  phone: string;
  name: string;
  teamName: string;
  note: string;
  isActive: boolean;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  bookingCount: number;
  completedCount: number;
  cancelledCount: number;
  totalPaidBaht: number;
  promotionSaleCount: number;
  promotionPaidBaht: number;
  lastBookingAt: string | null;
  recentBookings: Array<{
    id: number;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    paymentStatus: string;
    finalPrice: number;
    amountPaidBaht: number;
  }>;
  recentLedger: Array<{
    id: number;
    kind: string;
    pointsDelta: number;
    balanceAfter: number;
    note: string;
    createdAt: string;
  }>;
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
export function calcFootballTurfPointsEarned(
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

export function formatFootballTurfLoyaltyEarnRule(bahtPerPoint: number, pointsPerUnit: number): string {
  const b = clampBahtPerPoint(bahtPerPoint);
  const p = clampPointsPerUnit(pointsPerUnit);
  if (p === 1) return `ทุกๆ ${b.toLocaleString("th-TH")} บาท ได้ 1 คะแนน`;
  return `ทุกๆ ${b.toLocaleString("th-TH")} บาท ได้ ${p.toLocaleString("th-TH")} คะแนน`;
}

export function normalizeFootballTurfMemberPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export function isFootballTurfMemberPhoneReady(raw: string): boolean {
  const n = normalizeFootballTurfMemberPhone(raw).length;
  return n >= 9 && n <= 10;
}

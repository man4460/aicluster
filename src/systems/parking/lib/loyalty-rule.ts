export type ParkingLoyaltySettingsDto = {
  enabled: boolean;
  baht_per_point: number;
  points_per_unit: number;
};

export function clampParkingBahtPerPoint(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.max(1, Math.min(Math.floor(value), 1_000_000));
}

export function clampParkingPointsPerUnit(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.floor(value), 1000));
}

export function calcParkingPointsEarned(amountPaidBaht: number, bahtPerPoint: number, pointsPerUnit: number): number {
  const amount = Math.max(0, Math.floor(amountPaidBaht));
  const unitBaht = clampParkingBahtPerPoint(bahtPerPoint);
  return Math.floor(amount / unitBaht) * clampParkingPointsPerUnit(pointsPerUnit);
}

export function normalizeParkingMemberPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export function isParkingMemberPhoneReady(raw: string): boolean {
  const length = normalizeParkingMemberPhone(raw).length;
  return length >= 9 && length <= 10;
}

export function formatParkingLoyaltyRule(bahtPerPoint: number, pointsPerUnit: number): string {
  return `ทุก ${clampParkingBahtPerPoint(bahtPerPoint).toLocaleString("th-TH")} บาท ได้ ${clampParkingPointsPerUnit(pointsPerUnit).toLocaleString("th-TH")} คะแนน`;
}

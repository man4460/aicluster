/** ข้อความกฎสะสมแต้มที่แสดงบน UI */
export function formatDrinkPosLoyaltyRule(stampsPerReward: number, rewardTitle: string): string {
  const n = Math.max(1, Math.min(Math.floor(stampsPerReward) || 10, 30));
  const title = rewardTitle.trim() || "ของรางวัล";
  return `ซื้อ ${n} ครั้ง แลก${title}`;
}

export function clampDrinkPosStampsPerReward(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.max(1, Math.min(Math.floor(value), 30));
}

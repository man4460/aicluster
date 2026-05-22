export type StampCardView = {
  currentStamps: number;
  stampsPerReward: number;
  readyToRedeem: boolean;
  slots: boolean[];
};

export function buildStampSlots(current: number, perReward: number): StampCardView {
  const cap = Math.max(1, Math.min(perReward, 30));
  const stamps = Math.max(0, Math.min(current, cap));
  return {
    currentStamps: stamps,
    stampsPerReward: cap,
    readyToRedeem: stamps >= cap,
    slots: Array.from({ length: cap }, (_, i) => i < stamps),
  };
}

export function nextStampBalance(current: number, perReward: number): number {
  const cap = Math.max(1, Math.min(perReward, 30));
  if (current >= cap) return cap;
  return current + 1;
}

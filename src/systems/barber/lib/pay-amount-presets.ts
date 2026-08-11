/** ค่าเริ่มต้นปุ่มลัดยอดรับชำระ (บาท) */
export const DEFAULT_BARBER_PAY_AMOUNT_PRESETS = [80, 100, 120, 150] as const;

const MAX_PRESETS = 8;
const MAX_AMOUNT = 999_999;

export function parseBarberPayAmountPresets(raw: string | null | undefined): number[] {
  if (!raw?.trim()) return [...DEFAULT_BARBER_PAY_AMOUNT_PRESETS];
  const parts = raw.split(/[,/\s]+/).map((p) => p.trim()).filter(Boolean);
  const nums: number[] = [];
  const seen = new Set<number>();
  for (const p of parts) {
    const n = Number(p.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) continue;
    const rounded = Math.round(n);
    if (seen.has(rounded)) continue;
    seen.add(rounded);
    nums.push(rounded);
    if (nums.length >= MAX_PRESETS) break;
  }
  return nums.length > 0 ? nums : [...DEFAULT_BARBER_PAY_AMOUNT_PRESETS];
}

export function serializeBarberPayAmountPresets(amounts: number[]): string {
  return parseBarberPayAmountPresets(amounts.join(",")).join(",");
}

export function formatBarberPayAmountPresetsInput(raw: string | null | undefined): string {
  return parseBarberPayAmountPresets(raw).join(", ");
}

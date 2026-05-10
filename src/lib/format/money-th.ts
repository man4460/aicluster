/** จำนวนเงินเก็บเป็นสตางค์ (int) เพื่อเลี่ยงทศนิยมคลาดเคลื่อน */

export function formatBahtFromSatang(satang: number): string {
  const neg = satang < 0;
  const n = Math.abs(satang);
  const whole = Math.floor(n / 100);
  const frac = n % 100;
  const s = `${whole.toLocaleString("th-TH")}.${frac.toString().padStart(2, "0")}`;
  return neg ? `−${s}` : s;
}

export function parseBahtToSatang(input: string): number | null {
  const t = input.trim().replace(/,/g, "");
  if (!t) return null;
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const whole = Number(m[1]);
  if (!Number.isFinite(whole) || whole < 0) return null;
  const fracRaw = m[2] ?? "";
  const frac = fracRaw.length === 0 ? 0 : Number((fracRaw + "00").slice(0, 2));
  if (!Number.isFinite(frac)) return null;
  return whole * 100 + frac;
}

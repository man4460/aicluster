/**
 * APP_URL / NEXT_PUBLIC_APP_URL ใช้ต่อ path ระดับราก (/check-in, /parking/...)
 * ถ้าใส่ path ต่อท้าย (เช่น .../dashboard) ลิงก์จะพัง — ตัดให้เหลือ origin
 */
export function normalizeAppPublicBase(url: string | undefined | null): string {
  const s = (url ?? "").trim().replace(/\/$/, "");
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) return s;
  try {
    return new URL(s).origin;
  } catch {
    return s;
  }
}

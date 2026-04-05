/** URL ที่ API อนุญาตบันทึกใน roster — ต้องเป็น path ใต้โฟลเดอร์อัปโหลดของโมดูลนี้ */
export const ROSTER_PHOTO_URL_PREFIX = "/uploads/attendance-roster/" as const;

export function isValidRosterPhotoUrl(url: string): boolean {
  const t = url.trim();
  if (!t || t.length > 512) return false;
  return t.startsWith(ROSTER_PHOTO_URL_PREFIX) && !t.includes("..");
}

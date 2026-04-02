/**
 * จัดรูปแบบเลขที่บ้านให้เปรียบเทียบ/บันทึกแบบทั้งข้อความ — รองรับสแลชแบบต่าง ๆ และตัดอักขระความกว้างศูนย์
 */
const SLASH_LIKE = /[\u2044\u2215\uFF0F]/g;
const ZERO_WIDTH = /[\u200B\u200C\u200D\uFEFF]/g;

export function normalizeVillageHouseNo(raw: string): string {
  let s = raw.normalize("NFC").replace(ZERO_WIDTH, "").trim();
  s = s.replace(SLASH_LIKE, "/");
  s = s.replace(/\s+/g, " ");
  return s;
}

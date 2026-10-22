/** รหัสแบบราชการมุมแผ่น เช่น (ส ๕๖ – ๒๖) — ห้ามโชว์บนฟอร์ม / พรีวิว */

const FORM_CODE_INLINE_RE =
  /\(?\s*ส\.?\s*[๕5][๖6]\s*[-–—‐]\s*[๐-๙0-9]+(?:\/[๐-๙0-9]+)?\s*\)?/g;
const FORM_CODE_STANDALONE_RE =
  /^\(?\s*ส\.?\s*[๕5][๖6]\s*[-–—‐]\s*[๐-๙0-9]+(?:\/[๐-๙0-9]+)?\s*\)?$/;
const CORNER_PRINT_CODE_RE = /^ค\.?\s*[๐-๙0-9]+\s*[-–—]?\s*ต\.?\s*[๐-๙0-9]+$/;
const CORNER_K_CODE_RE = /^ค\.?\s*[๐-๙0-9]{1,4}$/;

export function isStandaloneOfficialFormCode(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return false;
  return (
    FORM_CODE_STANDALONE_RE.test(t) ||
    CORNER_PRINT_CODE_RE.test(t) ||
    CORNER_K_CODE_RE.test(t)
  );
}

export function stripOfficialFormCodesFromText(text: string): string {
  return text.replace(FORM_CODE_INLINE_RE, "").replace(/\s+/g, " ").trim();
}

/** ตัดย่อหน้า / ข้อความรหัสฟอร์มออกจาก HTML ที่แปลงจาก Word */
export function stripOfficialFormCodesFromHtml(html: string): string {
  return html
    .replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (p) => {
      const text = p.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return isStandaloneOfficialFormCode(text) ? "" : p;
    })
    .replace(FORM_CODE_INLINE_RE, "")
    .replace(/ค\.?\s*[๐-๙0-9]+\s*[-–—]?\s*ต\.?\s*[๐-๙0-9]+/g, "");
}

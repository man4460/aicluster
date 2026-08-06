/**
 * ชื่อไฟล์ที่แสดงให้ลูกค้า/ผู้ใช้ — ตั้งเอง ไม่ผูกกับชื่อบนดิสก์
 */

export const UPLOAD_DISPLAY_NAME_MAX = 160;

/** ตัดอักขระอันตราย คงอักษรไทย/อังกฤษ ตัวเลข ช่องว่าง จุด ขีด */
export function normalizeUploadDisplayName(raw: string | null | undefined): string {
  const cleaned = (raw ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, UPLOAD_DISPLAY_NAME_MAX);
  return cleaned;
}

/**
 * แนะนำชื่อแสดงเริ่มต้นจากชื่อไฟล์ต้นทาง (ตัดนามสกุล) — ผู้ใช้แก้เองได้
 * ไม่บังคับใช้; ถ้าต้องการให้ว่างให้ส่ง `preferEmpty: true`
 */
export function suggestUploadDisplayName(
  originalFileName: string | null | undefined,
  options?: { preferEmpty?: boolean },
): string {
  if (options?.preferEmpty) return "";
  const base = (originalFileName ?? "").replace(/\\/g, "/").split("/").pop() ?? "";
  const withoutExt = base.replace(/\.[^.]+$/, "");
  return normalizeUploadDisplayName(withoutExt || base);
}

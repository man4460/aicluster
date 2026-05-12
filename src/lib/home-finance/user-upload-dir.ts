/**
 * Folder ย่อยสำหรับเก็บรูปสลิป / ไฟล์แนบของแต่ละผู้ใช้ภายใต้ `public/uploads/home-finance/`
 *
 * เป้าหมาย: ผู้ใช้แต่ละคนเก็บไฟล์ของตัวเองในโฟลเดอร์แยก (`/<userId>/<filename>`)
 * เพื่อให้ตรวจสอบ/แยก ownership ได้ง่าย และกัน collision ของชื่อไฟล์ข้ามผู้ใช้
 *
 * ใช้ `User.id` (cuid หรือ legacy `admin_001`) เป็นชื่อโฟลเดอร์ — เสถียร, unique, ไม่เปลี่ยนตาม
 * username ที่ผู้ใช้แก้ได้ภายหลัง
 */

const MAX_SEGMENT_LEN = 64;

/** sanitize ชื่อโฟลเดอร์ให้เป็น ASCII slug ตัวเล็ก ปลอดภัยกับทุก filesystem + URL */
export function sanitizeUploadSegment(raw: string): string {
  const slug = (raw ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SEGMENT_LEN);
  return slug;
}

/**
 * คืน folder segment สำหรับ owner ที่กำหนด — ใช้ `userId` เป็นหลัก
 * (sync — ไม่ต้องเข้า DB) เพื่อหลีกเลี่ยง collision ในกรณีที่ระบบในอนาคตอาจอนุญาตให้
 * เปลี่ยน `username` ได้ — โฟลเดอร์/path จะคงที่ตามตัว user
 */
export function resolveOwnerUploadSegment(ownerUserId: string): string {
  const slug = sanitizeUploadSegment(ownerUserId);
  return slug || "user";
}

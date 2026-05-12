/**
 * Folder ย่อยสำหรับเก็บรูปสลิป / ไฟล์แนบของแต่ละผู้ใช้ภายใต้ `public/uploads/home-finance/`
 *
 * เป้าหมาย: ผู้ใช้แต่ละคนเก็บไฟล์ของตัวเองในโฟลเดอร์แยก (`/<username>/<filename>`)
 * เพื่อให้ตรวจสอบ/แยก ownership ได้ง่าย และกัน collision ของชื่อไฟล์ข้ามผู้ใช้
 */
import { prisma } from "@/lib/prisma";

const FALLBACK_PREFIX_LEN = 12;
const MAX_SEGMENT_LEN = 40;

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
 * คืน folder segment (เช่น `mawell`) สำหรับ owner ที่กำหนด
 * - ใช้ `User.username` ถ้ามี (เพราะ unique และอ่านง่าย)
 * - fallback: prefix 12 ตัวแรกของ userId
 * - fallback สุดท้าย: `user` (ไม่ควรเกิดในระบบ)
 */
export async function resolveOwnerUploadSegment(ownerUserId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { username: true },
  });
  const fromName = sanitizeUploadSegment(u?.username ?? "");
  if (fromName) return fromName;
  const fromId = sanitizeUploadSegment(ownerUserId.slice(0, FALLBACK_PREFIX_LEN));
  return fromId || "user";
}

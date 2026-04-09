import type { ChatRoomKind, UserRole } from "@/generated/prisma/enums";

export type ThreadAccessFields = {
  id: string;
  authorId: string;
  roomKind: ChatRoomKind;
};

/**
 * ชุมชน: ทุกคนที่ล็อกอินอ่าน/ตอบได้
 * ติดต่อแอดมิน: เฉพาะเจ้าของกระทู้ + แอดมิน
 */
export function canAccessChatThread(
  viewer: { id: string; role: UserRole },
  thread: ThreadAccessFields,
): boolean {
  if (viewer.role === "ADMIN") return true;
  if (thread.roomKind === "COMMUNITY") return true;
  return thread.authorId === viewer.id;
}

/** แอดมิน: แก้ไขหัวข้อ / ลบกระทู้ได้ทุกประเภท */
export function canModerateChatThread(viewer: { role: UserRole }): boolean {
  return viewer.role === "ADMIN";
}

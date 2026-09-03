/** ชื่อไฟล์บนดิสก์หลังอัปโหลดแกลเลอรี (ใช้ได้ทั้ง server API) */
export function clubEventGalleryFileName(ownerUserId: string, eventId: string): string {
  return `${ownerUserId}_${eventId}_${Date.now()}.webp`;
}

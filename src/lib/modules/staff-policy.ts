/** พนักงาน (employerUserId) ใช้ได้เฉพาะโมดูลที่เจ้าของเปิดให้ — ไม่กินโทเคนตัวเอง */
export const STAFF_ALLOWED_MODULE_SLUGS = new Set<string>(["attendance", "barber"]);

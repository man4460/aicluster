import { Prisma } from "@/generated/prisma/client";

/** คอลัมน์/ตารางไม่ตรง schema — มักแก้ด้วย prisma migrate deploy + prisma generate แล้วรีสตาร์ทเซิร์ฟเวอร์ */
export function isPrismaSchemaMismatchError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2022" || e.code === "P2021";
  }
  const msg = e instanceof Error ? e.message : String(e);
  // MySQL driver บางเวอร์ชันส่งเป็น Error ธรรมดา — 1054 = unknown column
  if (
    /Unknown column/i.test(msg) &&
    (/fee_cycle|village_houses|photo_url|slip_photo_url|bundle_id|attendance_roster|check_in_face/i.test(msg) ||
      /\b1054\b/.test(msg))
  ) {
    return true;
  }
  return false;
}

/**
 * Client ที่ generate แล้วไม่ตรงกับ schema (เช่น มีฟิลด์ใน schema แต่โค้ดรันด้วย client เก่า)
 * มักเกิดหลัง git pull โดยยังไม่รัน prisma generate / ยังไม่รีบิลด์ Next
 */
export function isPrismaClientValidationSyncError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientValidationError;
}

export const PRISMA_GENERATE_HINT_TH =
  "Prisma Client ไม่ตรงกับ schema — หยุด next dev ทุกเทอร์มินัลก่อน (บน Windows ถ้าไม่หยุด รัน generate มักขึ้น EPERM) จากนั้นที่รากโปรเจกต์รัน npm run db:generate หรือ npx prisma generate แล้วลบโฟลเดอร์ .next แล้วสตาร์ทเซิร์ฟเวอร์ใหม่";

export function isPrismaUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export const PRISMA_SYNC_HINT_TH =
  "ฐานข้อมูลยังไม่อัปเดต schema — ที่รากโปรเจกต์รัน npx prisma migrate deploy แล้ว npx prisma generate จากนั้นรีสตาร์ทเซิร์ฟเวอร์";

/** ใช้เมื่อไม่แน่ใจว่าเป็น DB หรือ client — ครอบทั้ง migrate + generate */
export const PRISMA_FULL_SYNC_HINT_TH =
  "หยุด next dev ก่อน แล้วที่รากโปรเจกต์รัน: npx prisma migrate deploy แล้ว npx prisma generate ลบ .next แล้วสตาร์ทเซิร์ฟเวอร์ใหม่ (รีบิลด์ production ก็ได้)";

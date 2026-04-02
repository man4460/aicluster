import { Prisma } from "@/generated/prisma/client";

/** คอลัมน์/ตารางไม่ตรง schema — มักแก้ด้วย prisma migrate deploy + prisma generate แล้วรีสตาร์ทเซิร์ฟเวอร์ */
export function isPrismaSchemaMismatchError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2022" || e.code === "P2021";
  }
  const msg = e instanceof Error ? e.message : String(e);
  // MySQL driver บางเวอร์ชันส่งเป็น Error ธรรมดา
  if (/Unknown column/i.test(msg) && (/fee_cycle|village_houses/i.test(msg) || /\b1054\b/.test(msg))) {
    return true;
  }
  return false;
}

export function isPrismaUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export const PRISMA_SYNC_HINT_TH =
  "ฐานข้อมูลยังไม่อัปเดต schema — ที่รากโปรเจกต์รัน npx prisma migrate deploy แล้ว npx prisma generate จากนั้นรีสตาร์ทเซิร์ฟเวอร์";

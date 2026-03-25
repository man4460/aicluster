import { Prisma } from "@/generated/prisma/client";

/** คอลัมน์/ตารางไม่ตรง schema — มักแก้ด้วย prisma migrate deploy + prisma generate แล้วรีสตาร์ทเซิร์ฟเวอร์ */
export function isPrismaSchemaMismatchError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2022" || e.code === "P2021";
  }
  return false;
}

export const PRISMA_SYNC_HINT_TH =
  "ฐานข้อมูลหรือ Prisma client ไม่ตรงกับโค้ด — ในโฟลเดอร์ web รัน: npx prisma migrate deploy แล้ว npx prisma generate จากนั้นรีสตาร์ท dev server";

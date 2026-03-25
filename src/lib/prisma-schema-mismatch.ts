import { Prisma } from "@/generated/prisma/client";

/** ข้อความเมื่อตาราง/คอลัมน์ยังไม่มี (มักยังไม่รัน migrate) */
export const THAI_PRISMA_SCHEMA_MISMATCH =
  "ฐานข้อมูลยังไม่อัปเดต — ในโฟลเดอร์โปรเจกต์ web ให้รัน: npx prisma migrate deploy";

export function isPrismaSchemaMismatch(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    (e.code === "P2021" || e.code === "P2022")
  );
}

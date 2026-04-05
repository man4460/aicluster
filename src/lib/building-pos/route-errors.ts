import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

/** แปลง error จาก Prisma/DB เป็นข้อความที่ผู้ใช้เข้าใจ */
export function formatBuildingPosDbError(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P1001":
      case "P1008":
      case "P1017":
        return "เชื่อมต่อฐานข้อมูลไม่ได้ — เปิด MySQL แล้วตรวจ DATABASE_URL ใน .env";
      case "P2021":
        return "ยังไม่มีตารางที่จำเป็น — รัน npx prisma migrate deploy จากโฟลเดอร์โปรเจกต์";
      case "P2022":
        return "คอลัมน์ในฐานข้อมูลไม่ตรงกับโค้ด — รัน npx prisma migrate deploy แล้วลบโฟลเดอร์ .next แล้วรีสตาร์ท dev server";
      case "P2002":
        return "ข้อมูลซ้ำ — ลองใหม่";
      default:
        break;
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return "คำขอไม่ตรงสคีมา — รัน npx prisma generate ลบ .next แล้วรีสตาร์ทเซิร์ฟเวอร์";
  }

  const msg = err instanceof Error ? err.message : String(err);
  if (/payment_slip_url|Unknown column|doesn't exist|does not exist|ER_BAD_FIELD_ERROR/i.test(msg)) {
    return "ฐานข้อมูลยังไม่อัปเดต — รัน npx prisma migrate deploy แล้วลบ .next แล้วรีสตาร์ทเซิร์ฟเวอร์";
  }
  if (/ECONNREFUSED|connect ECONNREFUSED|Can't reach database server/i.test(msg)) {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจว่า MySQL รันอยู่และพอร์ตใน DATABASE_URL ถูกต้อง";
  }
  if (/building_pos_orders|Table .* doesn't exist/i.test(msg)) {
    return "ยังไม่มีตารางออเดอร์ POS — รัน npx prisma migrate deploy";
  }

  return "โหลดข้อมูลไม่สำเร็จ — ลองรีเฟรช หรือรัน prisma migrate deploy แล้วรีสตาร์ทเซิร์ฟเวอร์ (ดู log ในเทอร์มินัลที่รัน next dev)";
}

export function jsonBuildingPosError(message: string, err: unknown, status: number) {
  const body: { error: string; debug?: string } = { error: message };
  if (process.env.NODE_ENV === "development") {
    const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    body.debug = detail.slice(0, 4000);
  }
  return NextResponse.json(body, { status });
}

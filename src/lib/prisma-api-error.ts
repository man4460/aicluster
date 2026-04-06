import { Prisma } from "@/generated/prisma/client";
import { THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

/** แปลง error จาก Prisma/MySQL เป็นข้อความไทยสำหรับส่งใน API (ไม่รั่วรายละเอียดภายในโปรดักชัน) */
export function prismaErrorToApiMessage(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบว่า MySQL เปิดอยู่และ DATABASE_URL ใน .env ชี้ไปฐานที่ถูกต้อง";
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    const detail =
      process.env.NODE_ENV === "development" ? ` ${e.message.slice(0, 240)}` : "";
    return `รูปแบบคำขอไม่ถูกต้อง (Prisma)${detail}`;
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P1001" || e.code === "P1002" || e.code === "P1017") {
      return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบว่า MySQL เปิดอยู่และ DATABASE_URL ถูกต้อง";
    }
    if (e.code === "P2021" || e.code === "P2022") {
      return THAI_PRISMA_SCHEMA_MISMATCH;
    }
    if (e.code === "P2003") {
      return "ข้อมูลอ้างอิงไม่ตรงกับฐานข้อมูล — ลองล็อกอินใหม่ หรือติดต่อผู้ดูแลระบบ";
    }
    if (e.code === "P2002") {
      return "ข้อมูลซ้ำกับที่มีอยู่แล้ว — ลองเปลี่ยนชื่อหรือรายละเอียด";
    }
    if (e.code === "P2011" || e.code === "P2012") {
      return "ข้อมูลไม่ครบหรือไม่ถูกต้อง — ลองกรอกใหม่หรือติดต่อผู้ดูแล";
    }
    if (e.code === "P2010") {
      return THAI_PRISMA_SCHEMA_MISMATCH;
    }
    return `ฐานข้อมูลไม่สามารถดำเนินการได้ (รหัส ${e.code}) — ถ้าตารางยังไม่มี ให้รัน npx prisma migrate deploy แล้วรีสตาร์ทแอป`;
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/1146|ER_NO_SUCH_TABLE|Base table or view not found/i.test(msg)) {
    return "ฐานข้อมูลยังไม่อัปเดต — รัน `npx prisma migrate deploy` แล้วรีสตาร์ทแอป";
  }
  if (/Unknown column|ER_BAD_FIELD_ERROR|1054|no such column/i.test(msg)) {
    return "คอลัมน์ MySQL ไม่ตรงสคีมา — รัน `npx prisma migrate deploy` (migration ล่าสุด) หรือสคริปต์ `prisma/repair-user-columns.sql` บน MySQL แล้วรีสตาร์ทแอป";
  }
  if (/doesn't exist/i.test(msg)) {
    return "ฐานข้อมูลยังไม่อัปเดตให้ตรงกับแอป — รัน `npx prisma migrate deploy` แล้วรีสตาร์ทแอป";
  }
  if (/Data truncated|1265|ER_TRUNCATED_WRONG_VALUE|visit_type/i.test(msg)) {
    return "ค่าในฐานข้อมูลไม่ตรงกับแอป (เช่น enum) — รัน migration ให้ครบหรือตรวจสอบตาราง barber_service_logs";
  }
  if (/ECONNREFUSED|ETIMEDOUT|connect ECONNREFUSED/i.test(msg)) {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบว่า MySQL รันอยู่และพอร์ตใน DATABASE_URL ถูกต้อง";
  }
  if (process.env.NODE_ENV === "development" && e instanceof Error && e.message.trim()) {
    return e.message.trim().slice(0, 280);
  }
  return null;
}

/** ข้อความสั้นสำหรับ KnownRequest ที่ยังไม่ได้ map เป็นข้อความเฉพาะ */
export function prismaKnownRequestCode(e: unknown): string | null {
  return e instanceof Prisma.PrismaClientKnownRequestError ? e.code : null;
}

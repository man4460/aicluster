import { Prisma } from "@/generated/prisma/client";

/** แปลง error จาก Prisma/MySQL เป็นข้อความไทยสำหรับส่งใน API (ไม่รั่วรายละเอียดภายในโปรดักชัน) */
export function prismaErrorToApiMessage(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003") {
      return "ข้อมูลอ้างอิงไม่ตรงกับฐานข้อมูล — ลองล็อกอินใหม่ หรือติดต่อผู้ดูแลระบบ";
    }
    if (e.code === "P2002") {
      return "ข้อมูลซ้ำกับที่มีอยู่แล้ว — ลองเปลี่ยนชื่อหรือรายละเอียด";
    }
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/Unknown column|doesn't exist|ER_BAD_FIELD_ERROR|1054/i.test(msg)) {
    return "ฐานข้อมูลยังไม่อัปเดตให้ตรงกับแอป — รัน `npx prisma migrate deploy` บนเครื่องเซิร์ฟเวอร์ แล้วรีสตาร์ทแอป";
  }
  return null;
}

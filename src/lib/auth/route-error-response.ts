import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import {
  isPrismaSchemaMismatchError,
  isPrismaUniqueViolation,
  PRISMA_SYNC_HINT_TH,
} from "@/lib/prisma-errors";

const MYSQL_HINT_TH =
  "เชื่อมต่อ MySQL ไม่ได้ — เปิดบริการ MySQL แล้วตรวจ DATABASE_URL ใน .env (user, password, พอร์ต, ชื่อฐานข้อมูล) จากนั้นรัน npm run db:migrate";

export function authRouteErrorResponse(err: unknown, logLabel: string): NextResponse {
  console.error(`[${logLabel}]`, err);

  if (isPrismaUniqueViolation(err)) {
    return NextResponse.json({ error: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 409 });
  }

  if (isPrismaSchemaMismatchError(err)) {
    return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 500 });
  }

  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("AUTH_SECRET")) {
    return NextResponse.json(
      { error: "ตั้ง AUTH_SECRET ใน .env ให้ยาวอย่างน้อย 32 ตัวอักษร (ใช้สตริงสุ่ม ไม่ใช่ข้อความตัวอย่างสั้นเกินไป)" },
      { status: 500 },
    );
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json({ error: MYSQL_HINT_TH }, { status: 500 });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P1001" || err.code === "P1017") {
      return NextResponse.json({ error: MYSQL_HINT_TH }, { status: 500 });
    }
  }

  if (/P1001|P1017|Can't reach database|ECONNREFUSED|Server has closed the connection/i.test(message)) {
    return NextResponse.json({ error: MYSQL_HINT_TH }, { status: 500 });
  }

  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json(
    {
      error: isDev
        ? message
        : "เซิร์ฟเวอร์ขัดข้อง — ตรวจ MySQL, AUTH_SECRET ใน .env และ log เซิร์ฟเวอร์",
    },
    { status: 500 },
  );
}

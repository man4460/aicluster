import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import {
  isPrismaClientValidationSyncError,
  isPrismaSchemaMismatchError,
  PRISMA_GENERATE_HINT_TH,
  PRISMA_SYNC_HINT_TH,
} from "@/lib/prisma-errors";

/** แปลง error จาก Prisma/DB เป็นข้อความสำหรับ API ลานล้างรถ (session) */
export function formatCarWashSessionDbError(err: unknown): string {
  if (isPrismaSchemaMismatchError(err)) return PRISMA_SYNC_HINT_TH;
  if (isPrismaClientValidationSyncError(err)) return PRISMA_GENERATE_HINT_TH;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P1001":
      case "P1008":
      case "P1017":
        return "เชื่อมต่อฐานข้อมูลไม่ได้ — เปิด MySQL แล้วตรวจ DATABASE_URL ใน .env";
      case "P2021":
        return "ยังไม่มีตารางที่จำเป็น — ที่รากโปรเจกต์รัน npx prisma migrate deploy";
      case "P2022":
        return PRISMA_SYNC_HINT_TH;
      case "P2002":
        return "ข้อมูลซ้ำ — ลองใหม่";
      default:
        break;
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจ MySQL และ DATABASE_URL ใน .env";
  }

  const fromHelper = prismaErrorToApiMessage(err);
  if (fromHelper) return fromHelper;

  const msg = err instanceof Error ? err.message : String(err);
  if (
    /Cannot read properties of undefined \(reading ['"](?:find(?:Unique|Many)|create|update|delete)/i.test(
      msg,
    )
  ) {
    return PRISMA_GENERATE_HINT_TH;
  }
  if (/ECONNREFUSED|Can't reach database server|P1001|P1017/i.test(msg)) {
    return "เชื่อมต่อฐานข้อมูลไม่ได้ — เปิด MySQL แล้วตรวจ DATABASE_URL";
  }
  if (/car_wash_visits|car_wash_|Unknown column|photo_url|slip_photo_url|bundle_id|ER_BAD_FIELD_ERROR|1054/i.test(msg)) {
    return PRISMA_SYNC_HINT_TH;
  }

  return "โหลดหรือบันทึกข้อมูลไม่สำเร็จ — ดู log ในเทอร์มินัลที่รัน next dev หรือรัน npx prisma migrate deploy แล้วรีสตาร์ทเซิร์ฟเวอร์";
}

export function jsonCarWashSessionError(err: unknown, logLabel: string): NextResponse {
  console.error(`[${logLabel}]`, err);
  const error = formatCarWashSessionDbError(err);
  const body: { error: string; debug?: string } = { error };
  if (process.env.NODE_ENV === "development") {
    const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    body.debug = detail.slice(0, 4000);
  }
  return NextResponse.json(body, { status: 500 });
}

import { NextResponse } from "next/server";

/** 500 JSON — โหมด dev แนบข้อความจริงจาก Error เพื่อดีบัก */
export function jsonServerError(logLabel: string, e: unknown): NextResponse {
  console.error(logLabel, e);
  const detail = e instanceof Error ? e.message : String(e);
  const brief =
    "เซิร์ฟเวอร์ผิดพลาด — รีสตาร์ท dev หลัง prisma generate หรือรัน prisma migrate deploy บนฐานข้อมูลนี้";
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === "development" ? `${brief} (${detail})` : brief,
    },
    { status: 500 },
  );
}

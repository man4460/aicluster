import { NextResponse } from "next/server";
import { pruneAttendanceFacePhotosOlderThanMonths } from "@/lib/attendance/prune-face-photos";

const RETENTION_MONTHS = 3;

/**
 * ลบรูปใบหน้าเช็คเข้าที่เก่ากว่า 3 เดือน (ไฟล์ + เคลียร์ URL ใน attendance_logs)
 * เรียกจาก cron รายเดือน — ตั้ง CRON_SECRET แล้วส่ง
 *   Authorization: Bearer <CRON_SECRET> หรือ ?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 8) {
    return NextResponse.json(
      { error: "CRON_SECRET ยังไม่ตั้งค่าในเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const url = new URL(req.url);
  const q = url.searchParams.get("secret");
  if (bearer !== secret && q !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const r = await pruneAttendanceFacePhotosOlderThanMonths(RETENTION_MONTHS);
    return NextResponse.json({
      ok: true,
      retentionMonths: RETENTION_MONTHS,
      ...r,
    });
  } catch (e) {
    console.error("[attendance-prune-faces]", e);
    return NextResponse.json({ error: "ลบไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}

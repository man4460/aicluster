import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkOutAsGuest,
} from "@/lib/attendance/service";
import { resolvePublicAttendanceTrialSessionId } from "@/lib/attendance/public-trial-scope";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(9).max(32),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  locationId: z.number().int().positive().optional().nullable(),
  trialSessionId: z.string().max(36).optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-pub-out:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const portalOk = await isAttendancePublicOpenForOwner(parsed.data.ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });

  const { trialSessionId } = await resolvePublicAttendanceTrialSessionId(
    parsed.data.ownerId,
    parsed.data.trialSessionId,
  );

  try {
    const log = await checkOutAsGuest({
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      guestPhone: parsed.data.phone,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      locationId: parsed.data.locationId ?? null,
    });
    return NextResponse.json({
      ok: true,
      log: {
        id: log.id,
        checkOutTime: log.checkOutTime?.toISOString() ?? null,
        status: log.status,
        lateCheckIn: log.lateCheckIn,
        earlyCheckOut: log.earlyCheckOut,
      },
    });
  } catch (e) {
    if (e instanceof AttendanceGeoError) {
      return NextResponse.json({ error: "อยู่นอกรัศมีที่อนุญาต" }, { status: 400 });
    }
    if (e instanceof AttendanceBusinessError) {
      if (e.message === "NOT_CHECKED_IN")
        return NextResponse.json({ error: "ยังไม่ได้เช็คเข้า" }, { status: 400 });
      if (e.message === "BAD_LOCATION" || e.message === "NO_SHIFTS")
        return NextResponse.json({ error: "จุดเช็คไม่ถูกต้อง" }, { status: 400 });
    }
    console.error("[attendance public check-out]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

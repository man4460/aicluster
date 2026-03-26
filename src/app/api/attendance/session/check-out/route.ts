import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkOutAsUser,
} from "@/lib/attendance/service";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

const bodySchema = z.object({
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const log = await checkOutAsUser({
      ownerUserId: ctx.billingUserId,
      trialSessionId: scope.trialSessionId,
      actorUserId: ctx.actorUserId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
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
        return NextResponse.json({ error: "ยังไม่ได้เช็คเข้าวันนี้" }, { status: 400 });
      if (e.message === "NO_SETTINGS")
        return NextResponse.json({ error: "ยังไม่ตั้งค่าระบบ" }, { status: 400 });
    }
    console.error("[attendance session check-out]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { saveAttendanceFacePhoto } from "@/lib/attendance/face-photo-file";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkInAsUser,
} from "@/lib/attendance/service";

const fieldsSchema = z.object({
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const face = form.get("face");
  if (!face || !(face instanceof File) || face.size === 0) {
    return NextResponse.json({ error: "ต้องถ่ายรูปใบหน้าก่อนเช็คเข้า" }, { status: 400 });
  }

  const parsed = fieldsSchema.safeParse({
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
  });
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const buf = Buffer.from(await face.arrayBuffer());
  let photoUrl: string;
  try {
    photoUrl = await saveAttendanceFacePhoto(ctx.billingUserId, buf, face.type || "image/jpeg");
  } catch (e) {
    const msg =
      e instanceof Error && e.message === "too_large"
        ? "รูปใหญ่เกิน 3MB"
        : e instanceof Error && e.message === "bad_type"
          ? "รองรับเฉพาะ JPG PNG WEBP"
          : "อัปโหลดรูปไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const log = await checkInAsUser({
      ownerUserId: ctx.billingUserId,
      actorUserId: ctx.actorUserId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      checkInFacePhotoUrl: photoUrl,
    });
    return NextResponse.json({
      ok: true,
      log: {
        id: log.id,
        checkInTime: log.checkInTime?.toISOString() ?? null,
        status: log.status,
        lateCheckIn: log.lateCheckIn,
      },
    });
  } catch (e) {
    if (e instanceof AttendanceGeoError) {
      return NextResponse.json({ error: "อยู่นอกรัศมีที่อนุญาต — เปิดตำแหน่งแล้วลองใหม่" }, { status: 400 });
    }
    if (e instanceof AttendanceBusinessError) {
      if (e.message === "NO_SETTINGS")
        return NextResponse.json({ error: "เจ้าของยังไม่ตั้งค่าจุดเช็คอิน" }, { status: 400 });
      if (e.message === "ALREADY_CHECKED_IN")
        return NextResponse.json({ error: "เช็คเข้าแล้ววันนี้ — เช็คออกก่อนเช็คเข้าใหม่" }, { status: 400 });
    }
    console.error("[attendance session check-in]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

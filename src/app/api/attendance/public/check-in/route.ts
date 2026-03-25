import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { saveAttendanceFacePhoto } from "@/lib/attendance/face-photo-file";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkInAsGuest,
} from "@/lib/attendance/service";

const fieldsSchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(9).max(32),
  name: z.string().max(100).optional().nullable(),
  visitorKind: z.enum(["ROSTER_STAFF", "EXTERNAL_GUEST"]),
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-pub-in:${ip}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

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

  const locRaw = form.get("locationId");
  let locationId: number | undefined;
  if (locRaw != null && String(locRaw).trim() !== "") {
    const n = Number(locRaw);
    if (Number.isInteger(n) && n > 0) locationId = n;
  }

  const raw = {
    ownerId: String(form.get("ownerId") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    name: form.get("name") != null ? String(form.get("name")) : null,
    visitorKind: String(form.get("visitorKind") ?? "").trim(),
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
  };

  const parsed = fieldsSchema.safeParse({
    ...raw,
    name: raw.name && raw.name.trim().length > 0 ? raw.name.trim().slice(0, 100) : null,
  });
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const portalOk = await isAttendancePublicOpenForOwner(parsed.data.ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });

  const buf = Buffer.from(await face.arrayBuffer());
  let photoUrl: string;
  try {
    photoUrl = await saveAttendanceFacePhoto(parsed.data.ownerId, buf, face.type || "image/jpeg");
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
    const log = await checkInAsGuest({
      ownerUserId: parsed.data.ownerId,
      guestPhone: parsed.data.phone,
      guestName: parsed.data.name ?? null,
      visitorKind: parsed.data.visitorKind,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      checkInFacePhotoUrl: photoUrl,
      locationId: locationId ?? null,
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
      return NextResponse.json({ error: "อยู่นอกรัศมีที่อนุญาต" }, { status: 400 });
    }
    if (e instanceof AttendanceBusinessError) {
      if (e.message === "BAD_PHONE") return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
      if (e.message === "NO_SETTINGS")
        return NextResponse.json({ error: "ยังไม่ตั้งค่าระบบ" }, { status: 400 });
      if (e.message === "ALREADY_CHECKED_IN")
        return NextResponse.json({ error: "เช็คเข้าแล้ววันนี้" }, { status: 400 });
      if (e.message === "ROSTER_NO_MATCH")
        return NextResponse.json(
          { error: "เบอร์นี้ไม่อยู่ในรายชื่อพนักงาน — ให้เจ้าของเพิ่มชื่อ หรือเลือกบุคคลภายนอก" },
          { status: 400 },
        );
      if (e.message === "BAD_LOCATION" || e.message === "NO_SHIFTS")
        return NextResponse.json({ error: "จุดเช็คไม่ถูกต้อง — สแกน QR / ลิงก์ใหม่" }, { status: 400 });
    }
    console.error("[attendance public check-in]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

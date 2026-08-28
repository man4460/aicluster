import { NextResponse } from "next/server";
import { z } from "zod";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { saveAttendanceFacePhoto } from "@/lib/attendance/face-photo-file";
import { FACE_DESCRIPTOR_LENGTH } from "@/lib/attendance/face-descriptor";
import { ATTENDANCE_LOG_CHANNEL } from "@/lib/attendance/log-channel";
import { matchPublicFaceToRoster, PUBLIC_FACE_FORM_DESCRIPTOR_MAX } from "@/lib/attendance/public-face-roster-match";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import { resolvePublicAttendanceTrialSessionId } from "@/lib/attendance/public-trial-scope";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkInAsGuest,
  checkOutAsGuest,
} from "@/lib/attendance/service";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const descriptorSchema = z.array(z.number().finite()).length(FACE_DESCRIPTOR_LENGTH);

const fieldsSchema = z.object({
  ownerId: z.string().min(10).max(64),
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
  descriptor: descriptorSchema,
  descriptors: z.array(descriptorSchema).max(PUBLIC_FACE_FORM_DESCRIPTOR_MAX).optional(),
  /** ถ้าระบุ — บังคับเข้าหรือออก (คีออสก์มีปุ่มแยก) · ไม่ระบุ = สลับอัตโนมัติ */
  intent: z.enum(["check_in", "check_out"]).optional(),
});

/** สแกนใบหน้า — เช็คเข้าหรือเช็คออกตามสถานะวันนี้ของพนักงานที่จับคู่ได้ */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-pub-face-punch:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const face = form.get("face");
  if (!face || !(face instanceof File) || face.size === 0) {
    return NextResponse.json({ error: "ต้องถ่ายรูปใบหน้าก่อนบันทึก" }, { status: 400 });
  }

  let descriptorRaw: unknown;
  try {
    descriptorRaw = JSON.parse(String(form.get("descriptor") ?? ""));
  } catch {
    return NextResponse.json({ error: "ข้อมูลใบหน้าไม่ถูกต้อง" }, { status: 400 });
  }

  const locRaw = form.get("locationId");
  let locationId: number | undefined;
  if (locRaw != null && String(locRaw).trim() !== "") {
    const n = Number(locRaw);
    if (Number.isInteger(n) && n > 0) locationId = n;
  }

  let descriptorsRaw: unknown;
  const descriptorsField = form.get("descriptors");
  if (descriptorsField != null && String(descriptorsField).trim() !== "") {
    try {
      descriptorsRaw = JSON.parse(String(descriptorsField));
    } catch {
      descriptorsRaw = undefined;
    }
  }

  const intentRaw = String(form.get("intent") ?? "").trim();
  const intentParsed =
    intentRaw === "check_in" || intentRaw === "check_out" ? intentRaw : undefined;

  const parsed = fieldsSchema.safeParse({
    ownerId: String(form.get("ownerId") ?? "").trim(),
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
    descriptor: descriptorRaw,
    ...(descriptorsRaw !== undefined ? { descriptors: descriptorsRaw } : {}),
    ...(intentParsed ? { intent: intentParsed } : {}),
  });
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const portalOk = await isAttendancePublicOpenForOwner(parsed.data.ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });

  const trialRaw = form.get("trialSessionId");
  const trialSessionIdParam =
    trialRaw != null && String(trialRaw).trim() !== "" ? String(trialRaw).trim() : null;
  const { trialSessionId } = await resolvePublicAttendanceTrialSessionId(
    parsed.data.ownerId,
    trialSessionIdParam,
  );

  const settings = await prisma.attendanceSettings.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: parsed.data.ownerId,
        trialSessionId,
      },
    },
    select: { faceCheckInEnabled: true },
  });
  if (!settings?.faceCheckInEnabled) {
    return NextResponse.json({ error: "ยังไม่เปิดเช็คอินด้วยใบหน้า" }, { status: 400 });
  }

  const matched = await matchPublicFaceToRoster({
    ownerUserId: parsed.data.ownerId,
    trialSessionId,
    descriptor: parsed.data.descriptor,
    descriptors: parsed.data.descriptors,
  });
  if (!matched.ok) {
    return NextResponse.json({ error: matched.error }, { status: matched.status });
  }

  const now = new Date();
  const { start, end } = bangkokDayStartEnd(now);
  const open = await prisma.attendanceLog.findFirst({
    where: {
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      guestPhone: matched.entry.phone,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
  });

  try {
    if (parsed.data.intent === "check_in" && open) {
      return NextResponse.json(
        { error: "เช็คเข้าแล้ววันนี้ — กดปุ่ม «สแกนใบหน้าเช็คออก»" },
        { status: 400 },
      );
    }
    if (parsed.data.intent === "check_out" && !open) {
      return NextResponse.json(
        { error: "ยังไม่ได้เช็คเข้า — กดปุ่ม «สแกนใบหน้าเช็คเข้า»ก่อน" },
        { status: 400 },
      );
    }

    if (open) {
      const log = await checkOutAsGuest({
        ownerUserId: parsed.data.ownerId,
        trialSessionId,
        guestPhone: matched.entry.phone,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        locationId: locationId ?? null,
        checkOutChannel: ATTENDANCE_LOG_CHANNEL.OUT_PUBLIC_FACE,
      });
      return NextResponse.json({
        ok: true,
        action: "check_out" as const,
        matched: {
          rosterId: matched.entry.id,
          displayName: matched.entry.displayName,
          phone: matched.entry.phone,
          distance: matched.distance,
          margin: matched.margin,
          support: matched.support,
        },
        log: {
          id: log.id,
          checkInTime: log.checkInTime?.toISOString() ?? null,
          checkOutTime: log.checkOutTime?.toISOString() ?? null,
          status: log.status,
          lateCheckIn: log.lateCheckIn,
          earlyCheckOut: log.earlyCheckOut,
        },
      });
    }

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

    const log = await checkInAsGuest({
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      guestPhone: matched.entry.phone,
      guestName: matched.entry.displayName,
      visitorKind: "ROSTER_STAFF",
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      checkInFacePhotoUrl: photoUrl,
      locationId: locationId ?? null,
      checkInChannel: ATTENDANCE_LOG_CHANNEL.IN_PUBLIC_FACE,
    });

    return NextResponse.json({
      ok: true,
      action: "check_in" as const,
      matched: {
        rosterId: matched.entry.id,
        displayName: matched.entry.displayName,
        phone: matched.entry.phone,
        distance: matched.distance,
        margin: matched.margin,
        support: matched.support,
      },
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
      if (e.message === "ALREADY_CHECKED_IN")
        return NextResponse.json({ error: "เช็คเข้าแล้ววันนี้" }, { status: 400 });
      if (e.message === "NOT_CHECKED_IN")
        return NextResponse.json({ error: "ยังไม่ได้เช็คเข้า" }, { status: 400 });
      if (e.message === "NO_SETTINGS")
        return NextResponse.json({ error: "ยังไม่ตั้งค่าระบบ" }, { status: 400 });
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

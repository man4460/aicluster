import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { saveAttendanceFacePhoto } from "@/lib/attendance/face-photo-file";
import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_ENROLL_MAX_SAMPLES,
  matchFaceDescriptorMulti,
  parseFaceDescriptorBank,
  type FaceMatchCandidate,
} from "@/lib/attendance/face-descriptor";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkInAsGuest,
} from "@/lib/attendance/service";
import { resolvePublicAttendanceTrialSessionId } from "@/lib/attendance/public-trial-scope";
import { prisma } from "@/lib/prisma";

const descriptorSchema = z.array(z.number().finite()).length(FACE_DESCRIPTOR_LENGTH);

const fieldsSchema = z.object({
  ownerId: z.string().min(10).max(64),
  latitude: z.coerce.number().finite(),
  longitude: z.coerce.number().finite(),
  descriptor: descriptorSchema,
  /** เฟรมย่อยจากการสแกน — ใช้โหวตเพื่อความแม่นยำ */
  descriptors: z.array(descriptorSchema).max(FACE_ENROLL_MAX_SAMPLES).optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-pub-face-in:${ip}`, 40, 10 * 60 * 1000);
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

  const parsed = fieldsSchema.safeParse({
    ownerId: String(form.get("ownerId") ?? "").trim(),
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
    descriptor: descriptorRaw,
    ...(descriptorsRaw !== undefined ? { descriptors: descriptorsRaw } : {}),
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

  const roster = await prisma.attendanceRosterEntry.findMany({
    where: {
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      isActive: true,
      faceDescriptorJson: { not: null },
    },
    select: {
      id: true,
      displayName: true,
      phone: true,
      faceDescriptorJson: true,
    },
    take: 2500,
  });

  const candidates: FaceMatchCandidate[] = [];
  for (const row of roster) {
    const descriptors = parseFaceDescriptorBank(row.faceDescriptorJson);
    if (!descriptors?.length) continue;
    candidates.push({
      id: row.id,
      displayName: row.displayName,
      phone: row.phone,
      descriptors,
    });
  }

  const probes =
    parsed.data.descriptors && parsed.data.descriptors.length >= 2
      ? parsed.data.descriptors
      : [parsed.data.descriptor];
  const match = matchFaceDescriptorMulti(probes, candidates);
  if (!match.ok) {
    if (match.reason === "NO_CANDIDATES") {
      return NextResponse.json(
        { error: "ยังไม่มีพนักงานที่ลงทะเบียนใบหน้า — ให้เจ้าของลงทะเบียนในรายชื่อก่อน" },
        { status: 400 },
      );
    }
    if (match.reason === "AMBIGUOUS") {
      return NextResponse.json(
        { error: "ใบหน้าคล้ายหลายคนในรายชื่อ — ลองใหม่ในแสงดีขึ้น หรือให้เจ้าของลงทะเบียนใบหน้าใหม่" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "ไม่ตรงกับใบหน้าในรายชื่อ — ลองใหม่หรือใช้เช็คอินด้วยเบอร์" },
      { status: 400 },
    );
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

  try {
    const log = await checkInAsGuest({
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      guestPhone: match.entry.phone,
      guestName: match.entry.displayName,
      visitorKind: "ROSTER_STAFF",
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      checkInFacePhotoUrl: photoUrl,
      locationId: locationId ?? null,
    });
    return NextResponse.json({
      ok: true,
      matched: {
        rosterId: match.entry.id,
        displayName: match.entry.displayName,
        phone: match.entry.phone,
        distance: match.distance,
        margin: match.margin,
        support: match.support,
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
      if (e.message === "NO_SETTINGS")
        return NextResponse.json({ error: "ยังไม่ตั้งค่าระบบ" }, { status: 400 });
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

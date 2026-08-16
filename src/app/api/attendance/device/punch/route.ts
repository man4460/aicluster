import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireAttendanceDeviceAuth } from "@/lib/attendance/device-auth";
import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_ENROLL_MAX_SAMPLES,
  matchFaceDescriptorMulti,
  parseFaceDescriptorBank,
  type FaceMatchCandidate,
} from "@/lib/attendance/face-descriptor";
import {
  AttendanceBusinessError,
  AttendanceGeoError,
  checkInAsGuest,
  checkOutAsGuest,
  resolveAttendanceLocation,
} from "@/lib/attendance/service";
import { prisma } from "@/lib/prisma";

/**
 * ESP32 / อุปกรณ์เช็คชื่อ
 *
 * POST /api/attendance/device/punch
 * Headers:
 *   Authorization: Bearer att_dev_<keyId>_<secret>
 *   Content-Type: application/json
 *
 * Body ตัวอย่าง — ลายนิ้วมือ (เซ็นเซอร์คืน slot):
 *   { "action": "check_in", "method": "fingerprint", "fingerprintSlot": 3 }
 *
 * Body ตัวอย่าง — ใบหน้า (อุปกรณ์คำนวณ descriptor 128 มิติ):
 *   { "action": "check_in", "method": "face", "descriptor": [ ...128 floats ] }
 *
 * Body ตัวอย่าง — รู้ rosterId แล้ว (อุปกรณ์จับคู่เอง):
 *   { "action": "check_out", "method": "roster", "rosterId": 12 }
 *
 * พิกัด: ไม่ส่งได้ — ใช้พิกัดจุดเช็คในระบบ (เหมาะกับเครื่องติดที่ร้าน)
 */

const bodySchema = z.object({
  action: z.enum(["check_in", "check_out"]).default("check_in"),
  method: z.enum(["face", "fingerprint", "roster"]),
  fingerprintSlot: z.number().int().min(1).max(1000).optional(),
  rosterId: z.number().int().positive().optional(),
  descriptor: z.array(z.number().finite()).length(FACE_DESCRIPTOR_LENGTH).optional(),
  /** ส่งหลายเฟรมได้ (แนะนำ 3–4) — ระบบโหวตเพื่อความแม่นยำ */
  descriptors: z
    .array(z.array(z.number().finite()).length(FACE_DESCRIPTOR_LENGTH))
    .max(FACE_ENROLL_MAX_SAMPLES)
    .optional(),
  locationId: z.number().int().positive().optional().nullable(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  deviceId: z.string().trim().max(64).optional(),
});

async function resolveRosterByFace(
  ownerUserId: string,
  trialSessionId: string,
  probes: number[][],
) {
  const roster = await prisma.attendanceRosterEntry.findMany({
    where: {
      ownerUserId,
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
  return matchFaceDescriptorMulti(probes, candidates);
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-device-punch:${ip}`, 120, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  const auth = await requireAttendanceDeviceAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "ต้องส่ง JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const { ownerUserId, trialSessionId } = auth.auth;

  let roster: { id: number; displayName: string; phone: string } | null = null;
  let matchMeta: Record<string, unknown> = {};

  try {
    if (body.method === "fingerprint") {
      if (body.fingerprintSlot == null) {
        return NextResponse.json({ error: "ต้องส่ง fingerprintSlot" }, { status: 400 });
      }
      const row = await prisma.attendanceRosterEntry.findFirst({
        where: {
          ownerUserId,
          trialSessionId,
          isActive: true,
          fingerprintSlot: body.fingerprintSlot,
        },
        select: { id: true, displayName: true, phone: true },
      });
      if (!row) {
        return NextResponse.json(
          { error: "ไม่พบลายนิ้วมือในรายชื่อ — ลงทะเบียน slot นี้กับพนักงานก่อน" },
          { status: 404 },
        );
      }
      roster = row;
      matchMeta = { fingerprintSlot: body.fingerprintSlot };
    } else if (body.method === "face") {
      const probes =
        body.descriptors && body.descriptors.length >= 2
          ? body.descriptors
          : body.descriptor
            ? [body.descriptor]
            : [];
      if (probes.length === 0) {
        return NextResponse.json(
          { error: "ต้องส่ง descriptor (float[128]) หรือ descriptors (หลายเฟรม)" },
          { status: 400 },
        );
      }
      const match = await resolveRosterByFace(ownerUserId, trialSessionId, probes);
      if (!match.ok) {
        if (match.reason === "NO_CANDIDATES") {
          return NextResponse.json(
            { error: "ยังไม่มีพนักงานที่ลงทะเบียนใบหน้า" },
            { status: 400 },
          );
        }
        if (match.reason === "AMBIGUOUS") {
          return NextResponse.json(
            { error: "ใบหน้าคล้ายหลายคน — ปฏิเสธเพื่อความปลอดภัย" },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: "ไม่ตรงกับใบหน้าในรายชื่อ" }, { status: 404 });
      }
      roster = {
        id: match.entry.id,
        displayName: match.entry.displayName,
        phone: match.entry.phone,
      };
      matchMeta = {
        distance: match.distance,
        margin: match.margin,
        support: match.support,
        frames: probes.length,
      };
    } else {
      if (body.rosterId == null) {
        return NextResponse.json({ error: "ต้องส่ง rosterId" }, { status: 400 });
      }
      const row = await prisma.attendanceRosterEntry.findFirst({
        where: {
          id: body.rosterId,
          ownerUserId,
          trialSessionId,
          isActive: true,
        },
        select: { id: true, displayName: true, phone: true },
      });
      if (!row) return NextResponse.json({ error: "ไม่พบพนักงาน" }, { status: 404 });
      roster = row;
    }

    const site = await resolveAttendanceLocation(
      ownerUserId,
      body.locationId ?? null,
      trialSessionId,
    );
    const lat = body.latitude ?? site.allowedLocationLat;
    const lng = body.longitude ?? site.allowedLocationLng;
    const noteParts = [
      "device",
      body.method,
      body.deviceId ? `id=${body.deviceId}` : null,
    ].filter(Boolean);
    const note = noteParts.join(":").slice(0, 500);

    if (body.action === "check_in") {
      const log = await checkInAsGuest({
        ownerUserId,
        trialSessionId,
        guestPhone: roster.phone,
        guestName: roster.displayName,
        visitorKind: "ROSTER_STAFF",
        latitude: lat,
        longitude: lng,
        locationId: body.locationId ?? (site.locationId > 0 ? site.locationId : null),
        checkInFacePhotoUrl: null,
      });
      if (note) {
        await prisma.attendanceLog.update({
          where: { id: log.id },
          data: { note },
        });
      }
      return NextResponse.json({
        ok: true,
        action: "check_in",
        matched: {
          rosterId: roster.id,
          displayName: roster.displayName,
          phone: roster.phone,
          ...matchMeta,
        },
        log: {
          id: log.id,
          checkInTime: log.checkInTime?.toISOString() ?? null,
          lateCheckIn: log.lateCheckIn,
          status: log.status,
        },
      });
    }

    const log = await checkOutAsGuest({
      ownerUserId,
      trialSessionId,
      guestPhone: roster.phone,
      latitude: lat,
      longitude: lng,
      locationId: body.locationId ?? (site.locationId > 0 ? site.locationId : null),
    });
    if (note) {
      await prisma.attendanceLog.update({
        where: { id: log.id },
        data: { note },
      });
    }
    return NextResponse.json({
      ok: true,
      action: "check_out",
      matched: {
        rosterId: roster.id,
        displayName: roster.displayName,
        phone: roster.phone,
        ...matchMeta,
      },
      log: {
        id: log.id,
        checkOutTime: log.checkOutTime?.toISOString() ?? null,
        earlyCheckOut: log.earlyCheckOut,
        status: log.status,
      },
    });
  } catch (e) {
    if (e instanceof AttendanceGeoError) {
      return NextResponse.json({ error: "อยู่นอกรัศมีที่อนุญาต" }, { status: 400 });
    }
    if (e instanceof AttendanceBusinessError) {
      const map: Record<string, string> = {
        ALREADY_CHECKED_IN: "เช็คเข้าแล้ววันนี้",
        NOT_CHECKED_IN: "ยังไม่ได้เช็คเข้า",
        NO_SETTINGS: "ยังไม่ตั้งค่าระบบ",
        BAD_LOCATION: "ไม่พบจุดเช็ค",
        NO_SHIFTS: "ยังไม่มีกะ",
        ROSTER_NO_MATCH: "ไม่พบในรายชื่อ",
        BAD_PHONE: "เบอร์ไม่ถูกต้อง",
      };
      return NextResponse.json({ error: map[e.message] ?? e.message }, { status: 400 });
    }
    throw e;
  }
}

import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireAttendanceDeviceAuth } from "@/lib/attendance/device-auth";
import { resolveAttendanceLocation } from "@/lib/attendance/service";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/attendance/device/roster
 * ซิงก์รายชื่อไปยัง ESP32 (id, ชื่อ, slot นิ้ว, มีใบหน้าหรือไม่)
 */
export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`attendance-device-roster:${ip}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });

  const auth = await requireAttendanceDeviceAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { ownerUserId, trialSessionId } = auth.auth;
  const { searchParams } = new URL(req.url);
  const locRaw = searchParams.get("locationId");
  const locationId =
    locRaw && /^\d+$/.test(locRaw) ? Math.min(Number.MAX_SAFE_INTEGER, Number(locRaw)) : null;

  const [rows, site] = await Promise.all([
    prisma.attendanceRosterEntry.findMany({
      where: { ownerUserId, trialSessionId, isActive: true },
      orderBy: { displayName: "asc" },
      take: 2500,
      select: {
        id: true,
        displayName: true,
        phone: true,
        fingerprintSlot: true,
        faceDescriptorJson: true,
        rosterShiftIndex: true,
      },
    }),
    resolveAttendanceLocation(ownerUserId, locationId, trialSessionId).catch(() => null),
  ]);

  return NextResponse.json({
    ok: true,
    ownerUserId,
    trialSessionId,
    site: site
      ? {
          locationId: site.locationId,
          lat: site.allowedLocationLat,
          lng: site.allowedLocationLng,
          radiusMeters: site.radiusMeters,
        }
      : null,
    entries: rows.map((r) => ({
      rosterId: r.id,
      displayName: r.displayName,
      phone: r.phone,
      fingerprintSlot: r.fingerprintSlot,
      faceEnrolled: Boolean(r.faceDescriptorJson),
      rosterShiftIndex: r.rosterShiftIndex,
    })),
  });
}

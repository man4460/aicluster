import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { AttendanceBusinessError, resolveAttendanceLocation } from "@/lib/attendance/service";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId")?.trim() ?? "";
  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 400 });
  }

  const locRaw = searchParams.get("loc")?.trim();
  const locationId =
    locRaw && /^\d+$/.test(locRaw) ? Math.min(Number.MAX_SAFE_INTEGER, Number(locRaw)) : null;

  const rl = rateLimit(`attendance-pub-ctx:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });
  }

  const ok = await isAttendancePublicOpenForOwner(ownerId);
  if (!ok) return NextResponse.json({ error: "ไม่พร้อมใช้งาน" }, { status: 404 });

  await ensureAttendanceLocationsFromLegacy(ownerId);

  let site;
  try {
    site = await resolveAttendanceLocation(ownerId, locationId && locationId > 0 ? locationId : null);
  } catch (e) {
    if (e instanceof AttendanceBusinessError) {
      if (e.message === "NO_SETTINGS")
        return NextResponse.json({ error: "เจ้าของยังไม่ตั้งค่าระบบเช็คชื่อ" }, { status: 404 });
      if (e.message === "BAD_LOCATION" || e.message === "NO_SHIFTS")
        return NextResponse.json({ error: "ไม่พบจุดเช็คนี้" }, { status: 404 });
    }
    throw e;
  }

  const profile = await getBusinessProfile(ownerId);
  const orgName = profile?.name?.trim() || "องค์กร";

  const locations = await prisma.attendanceLocation.findMany({
    where: { ownerUserId: ownerId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  const starts = site.shifts.map((s) => s.startTime);
  const ends = site.shifts.map((s) => s.endTime);

  return NextResponse.json({
    ownerId,
    orgName,
    logoUrl: profile?.logoUrl ?? null,
    geofence: {
      lat: site.allowedLocationLat,
      lng: site.allowedLocationLng,
      radiusMeters: site.radiusMeters,
    },
    shiftStartTime: starts[0] ?? "09:00",
    shiftEndTime: ends[ends.length - 1] ?? "18:00",
    shifts: site.shifts,
    activeLocationId: site.locationId,
    locationLabel: locations.find((l) => l.id === site.locationId)?.name ?? null,
    locations: locations.map((l) => ({ id: l.id, name: l.name })),
  });
}

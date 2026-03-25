import type { AttendancePublicVisitorKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import { isWithinRadiusMeters } from "@/lib/geo/haversine";
import { finalizedAttendanceStatus } from "@/lib/attendance/finalize-status";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import {
  clampShiftIndex,
  isEarlyCheckOut,
  isEarlyCheckOutForShifts,
  isLateCheckIn,
  pickShiftIndexAuto,
} from "@/lib/attendance/shift";

export class AttendanceGeoError extends Error {
  constructor() {
    super("GEO_FAIL");
  }
}

export class AttendanceBusinessError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function getAttendanceSettings(ownerUserId: string) {
  return prisma.attendanceSettings.findUnique({ where: { ownerUserId } });
}

/** จุดเช็คที่ใช้คำนวณกะ / รัศมี — แยกตามโลเคชัน */
export type ResolvedAttendanceSite = {
  locationId: number;
  allowedLocationLat: number;
  allowedLocationLng: number;
  radiusMeters: number;
  shifts: { startTime: string; endTime: string }[];
};

export async function resolveAttendanceLocation(
  ownerUserId: string,
  locationId?: number | null,
): Promise<ResolvedAttendanceSite> {
  await ensureAttendanceLocationsFromLegacy(ownerUserId);

  const locs = await prisma.attendanceLocation.findMany({
    where: { ownerUserId },
    orderBy: { sortOrder: "asc" },
    include: { shifts: { orderBy: { sortOrder: "asc" } } },
  });

  if (locs.length === 0) {
    const s = await prisma.attendanceSettings.findUnique({ where: { ownerUserId } });
    if (!s) throw new AttendanceBusinessError("NO_SETTINGS");
    return {
      locationId: 0,
      allowedLocationLat: s.allowedLocationLat,
      allowedLocationLng: s.allowedLocationLng,
      radiusMeters: s.radiusMeters,
      shifts: [{ startTime: s.shiftStartTime, endTime: s.shiftEndTime }],
    };
  }

  const pick =
    locationId != null && locationId > 0 ? locs.find((l) => l.id === locationId) : locs[0];
  if (!pick) throw new AttendanceBusinessError("BAD_LOCATION");

  const shifts = pick.shifts.map((sh) => ({ startTime: sh.startTime, endTime: sh.endTime }));
  if (shifts.length === 0) throw new AttendanceBusinessError("NO_SHIFTS");

  return {
    locationId: pick.id,
    allowedLocationLat: pick.allowedLocationLat,
    allowedLocationLng: pick.allowedLocationLng,
    radiusMeters: pick.radiusMeters,
    shifts,
  };
}

export function assertInsideGeofence(
  s: { allowedLocationLat: number; allowedLocationLng: number; radiusMeters: number },
  lat: number,
  lng: number,
) {
  const g = isWithinRadiusMeters(s.allowedLocationLat, s.allowedLocationLng, lat, lng, s.radiusMeters);
  if (!g.ok) throw new AttendanceGeoError();
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function checkInAsUser(params: {
  ownerUserId: string;
  actorUserId: string;
  latitude: number;
  longitude: number;
  checkInFacePhotoUrl?: string | null;
  /** ไม่ส่ง = ใช้โลเคชันลำดับแรก (พนักงานล็อกอิน) */
  locationId?: number | null;
}) {
  const site = await resolveAttendanceLocation(params.ownerUserId, params.locationId ?? null);
  assertInsideGeofence(site, params.latitude, params.longitude);

  const now = new Date();
  const { start, end } = bangkokDayStartEnd(now);

  const open = await prisma.attendanceLog.findFirst({
    where: {
      ownerUserId: params.ownerUserId,
      actorUserId: params.actorUserId,
      guestPhone: null,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
  });
  if (open) throw new AttendanceBusinessError("ALREADY_CHECKED_IN");

  const actor = await prisma.user.findUnique({
    where: { id: params.actorUserId },
    select: { phone: true },
  });
  const aphone = normalizePhone(actor?.phone ?? "");
  let shiftIdx: number;
  if (aphone.length >= 9) {
    const roster = await prisma.attendanceRosterEntry.findFirst({
      where: { ownerUserId: params.ownerUserId, phone: aphone, isActive: true },
    });
    if (roster) shiftIdx = clampShiftIndex(roster.rosterShiftIndex, site.shifts.length);
    else shiftIdx = pickShiftIndexAuto(now, site.shifts);
  } else {
    shiftIdx = pickShiftIndexAuto(now, site.shifts);
  }

  const sh = site.shifts[shiftIdx] ?? site.shifts[0]!;
  const late = isLateCheckIn(now, sh.startTime);

  return prisma.attendanceLog.create({
    data: {
      ownerUserId: params.ownerUserId,
      actorUserId: params.actorUserId,
      checkInTime: now,
      checkInLat: params.latitude,
      checkInLng: params.longitude,
      checkInFacePhotoUrl: params.checkInFacePhotoUrl ?? null,
      lateCheckIn: late,
      appliedShiftIndex: shiftIdx,
      status: "AWAITING_CHECKOUT",
    },
  });
}

export async function checkInAsGuest(params: {
  ownerUserId: string;
  guestPhone: string;
  guestName: string | null;
  visitorKind: AttendancePublicVisitorKind;
  latitude: number;
  longitude: number;
  checkInFacePhotoUrl?: string | null;
  locationId?: number | null;
}) {
  const phone = normalizePhone(params.guestPhone);
  if (phone.length < 9) throw new AttendanceBusinessError("BAD_PHONE");

  const site = await resolveAttendanceLocation(params.ownerUserId, params.locationId ?? null);
  assertInsideGeofence(site, params.latitude, params.longitude);

  let resolvedName: string | null = params.guestName?.trim().slice(0, 100) || null;
  let shiftIdx: number;

  const now = new Date();
  const { start, end } = bangkokDayStartEnd(now);

  if (params.visitorKind === "ROSTER_STAFF") {
    const roster = await prisma.attendanceRosterEntry.findFirst({
      where: { ownerUserId: params.ownerUserId, phone, isActive: true },
    });
    if (!roster) throw new AttendanceBusinessError("ROSTER_NO_MATCH");
    if (!resolvedName || resolvedName.length === 0) resolvedName = roster.displayName.trim().slice(0, 100);
    shiftIdx = clampShiftIndex(roster.rosterShiftIndex, site.shifts.length);
  } else {
    shiftIdx = pickShiftIndexAuto(now, site.shifts);
  }

  const open = await prisma.attendanceLog.findFirst({
    where: {
      ownerUserId: params.ownerUserId,
      guestPhone: phone,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
  });
  if (open) throw new AttendanceBusinessError("ALREADY_CHECKED_IN");

  const sh = site.shifts[shiftIdx] ?? site.shifts[0]!;
  const late = isLateCheckIn(now, sh.startTime);

  return prisma.attendanceLog.create({
    data: {
      ownerUserId: params.ownerUserId,
      guestPhone: phone,
      guestName: resolvedName,
      publicVisitorKind: params.visitorKind,
      checkInTime: now,
      checkInLat: params.latitude,
      checkInLng: params.longitude,
      checkInFacePhotoUrl: params.checkInFacePhotoUrl ?? null,
      lateCheckIn: late,
      appliedShiftIndex: shiftIdx,
      status: "AWAITING_CHECKOUT",
    },
  });
}

export async function checkOutAsUser(params: {
  ownerUserId: string;
  actorUserId: string;
  latitude: number;
  longitude: number;
  locationId?: number | null;
}) {
  const site = await resolveAttendanceLocation(params.ownerUserId, params.locationId ?? null);
  assertInsideGeofence(site, params.latitude, params.longitude);

  const now = new Date();
  const { start, end } = bangkokDayStartEnd(now);

  const open = await prisma.attendanceLog.findFirst({
    where: {
      ownerUserId: params.ownerUserId,
      actorUserId: params.actorUserId,
      guestPhone: null,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
  });
  if (!open) throw new AttendanceBusinessError("NOT_CHECKED_IN");

  const early = earlyCheckoutForAppliedShift(now, site, open.appliedShiftIndex);
  const status = finalizedAttendanceStatus(open.lateCheckIn, early);

  return prisma.attendanceLog.update({
    where: { id: open.id },
    data: {
      checkOutTime: now,
      checkOutLat: params.latitude,
      checkOutLng: params.longitude,
      earlyCheckOut: early,
      status,
    },
  });
}

export async function checkOutAsGuest(params: {
  ownerUserId: string;
  guestPhone: string;
  latitude: number;
  longitude: number;
  locationId?: number | null;
}) {
  const phone = normalizePhone(params.guestPhone);
  if (phone.length < 9) throw new AttendanceBusinessError("BAD_PHONE");

  const site = await resolveAttendanceLocation(params.ownerUserId, params.locationId ?? null);
  assertInsideGeofence(site, params.latitude, params.longitude);

  const now = new Date();
  const { start, end } = bangkokDayStartEnd(now);

  const open = await prisma.attendanceLog.findFirst({
    where: {
      ownerUserId: params.ownerUserId,
      guestPhone: phone,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
  });
  if (!open) throw new AttendanceBusinessError("NOT_CHECKED_IN");

  const early = earlyCheckoutForAppliedShift(now, site, open.appliedShiftIndex);
  const status = finalizedAttendanceStatus(open.lateCheckIn, early);

  return prisma.attendanceLog.update({
    where: { id: open.id },
    data: {
      checkOutTime: now,
      checkOutLat: params.latitude,
      checkOutLng: params.longitude,
      earlyCheckOut: early,
      status,
    },
  });
}

function earlyCheckoutForAppliedShift(
  now: Date,
  site: ResolvedAttendanceSite,
  appliedShiftIndex: number | null,
): boolean {
  const n = site.shifts.length;
  if (n === 0) return false;
  const idx =
    appliedShiftIndex != null && appliedShiftIndex >= 0 && appliedShiftIndex < n
      ? appliedShiftIndex
      : null;
  if (idx != null) {
    return isEarlyCheckOut(now, site.shifts[idx]!.endTime);
  }
  if (n > 1) return isEarlyCheckOutForShifts(now, site.shifts);
  return isEarlyCheckOut(now, site.shifts[0]!.endTime);
}

/** รายการที่ยังไม่เช็คออกวันนี้ */
export async function openTodayUserLog(ownerUserId: string, actorUserId: string) {
  const { start, end } = bangkokDayStartEnd();
  return prisma.attendanceLog.findFirst({
    where: {
      ownerUserId,
      actorUserId,
      guestPhone: null,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
    include: {
      actor: { select: { fullName: true, username: true, email: true } },
    },
  });
}

/** รายการล่าสุดของวัน (รวมที่ปิดแล้ว) — แสดงสถานะสรุป */
export async function latestTodayUserLog(ownerUserId: string, actorUserId: string) {
  const { start, end } = bangkokDayStartEnd();
  return prisma.attendanceLog.findFirst({
    where: {
      ownerUserId,
      actorUserId,
      guestPhone: null,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
  });
}

export async function openTodayGuestLog(ownerUserId: string, guestPhone: string) {
  const phone = normalizePhone(guestPhone);
  if (phone.length < 9) return null;
  const { start, end } = bangkokDayStartEnd();
  return prisma.attendanceLog.findFirst({
    where: {
      ownerUserId,
      guestPhone: phone,
      checkOutTime: null,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
  });
}

export async function latestTodayGuestLog(ownerUserId: string, guestPhone: string) {
  const phone = normalizePhone(guestPhone);
  if (phone.length < 9) return null;
  const { start, end } = bangkokDayStartEnd();
  return prisma.attendanceLog.findFirst({
    where: {
      ownerUserId,
      guestPhone: phone,
      checkInTime: { gte: start, lt: end },
    },
    orderBy: { id: "desc" },
  });
}

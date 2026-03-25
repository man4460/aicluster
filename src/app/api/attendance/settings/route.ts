import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import {
  ATTENDANCE_MAX_LOCATIONS,
  ATTENDANCE_MAX_SHIFTS_PER_LOCATION,
  getAttendancePlanQuota,
} from "@/lib/attendance/plan-quota";
import {
  ensureAttendanceLocationsFromLegacy,
  syncAttendanceSettingsMirrorFromPrimaryLocation,
} from "@/lib/attendance/location-ensure";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";

const hhmm = z.string().regex(/^\d{1,2}:\d{2}$/);

const shiftInSchema = z.object({
  startTime: hhmm,
  endTime: hhmm,
});

const locationInSchema = z.object({
  /** มีเมื่อแก้โลเคชันเดิม — ไม่ส่งเมื่อเพิ่มจุดใหม่ */
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(80),
  allowedLocationLat: z.number().finite(),
  allowedLocationLng: z.number().finite(),
  radiusMeters: z.number().int().min(10).max(5000),
  shifts: z.array(shiftInSchema).min(1).max(ATTENDANCE_MAX_SHIFTS_PER_LOCATION),
});

const putSchema = z.object({
  locations: z.array(locationInSchema).min(1),
});

async function ensureSettings(ownerUserId: string) {
  const existing = await prisma.attendanceSettings.findUnique({ where: { ownerUserId } });
  if (existing) return existing;
  const user = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { latitude: true, longitude: true },
  });
  const lat =
    user?.latitude != null && Number.isFinite(user.latitude) ? user.latitude : 13.7563309;
  const lng =
    user?.longitude != null && Number.isFinite(user.longitude) ? user.longitude : 100.5017651;
  return prisma.attendanceSettings.create({
    data: {
      ownerUserId,
      allowedLocationLat: lat,
      allowedLocationLng: lng,
      radiusMeters: 150,
    },
  });
}

function normalizeHhmm(s: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return s;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const mi = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });

  try {
    await ensureSettings(ctx.billingUserId);
    await ensureAttendanceLocationsFromLegacy(ctx.billingUserId);

    const boss = await prisma.user.findUnique({
      where: { id: ctx.billingUserId },
      select: { subscriptionType: true, subscriptionTier: true },
    });
    if (!boss) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    const quota = getAttendancePlanQuota(boss.subscriptionType, boss.subscriptionTier);

    const locations = await prisma.attendanceLocation.findMany({
      where: { ownerUserId: ctx.billingUserId },
      orderBy: { sortOrder: "asc" },
      include: { shifts: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({
      quota,
      locations: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        allowedLocationLat: loc.allowedLocationLat,
        allowedLocationLng: loc.allowedLocationLng,
        radiusMeters: loc.radiusMeters,
        sortOrder: loc.sortOrder,
        shifts: loc.shifts.map((sh) => ({
          id: sh.id,
          startTime: sh.startTime,
          endTime: sh.endTime,
          sortOrder: sh.sortOrder,
        })),
      })),
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      console.error("[attendance settings GET] schema mismatch", e);
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    throw e;
  }
}

export async function PUT(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const boss = await prisma.user.findUnique({
    where: { id: ctx.billingUserId },
    select: { subscriptionType: true, subscriptionTier: true },
  });
  if (!boss) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const quota = getAttendancePlanQuota(boss.subscriptionType, boss.subscriptionTier);
  const locCount = parsed.data.locations.length;

  const idList = parsed.data.locations.map((l) => l.id).filter((x): x is number => x != null);
  if (idList.length !== new Set(idList).size) {
    return NextResponse.json({ error: "ข้อมูลโลเคชันซ้ำ" }, { status: 400 });
  }
  if (idList.length > 0) {
    const okCount = await prisma.attendanceLocation.count({
      where: { ownerUserId: ctx.billingUserId, id: { in: idList } },
    });
    if (okCount !== idList.length) {
      return NextResponse.json({ error: "รหัสโลเคชันไม่ถูกต้อง — โหลดหน้าใหม่แล้วลองอีกครั้ง" }, { status: 400 });
    }
  }

  if (locCount > ATTENDANCE_MAX_LOCATIONS) {
    return NextResponse.json(
      { error: "ระบบรองรับได้ 1 โลเคชันต่อองค์กรเท่านั้น" },
      { status: 400 },
    );
  }

  for (const loc of parsed.data.locations) {
    if (loc.shifts.length > quota.maxShiftsPerLocation) {
      return NextResponse.json(
        { error: `แต่ละโลเคชันตั้งกะได้ไม่เกิน ${quota.maxShiftsPerLocation} กะ` },
        { status: 400 },
      );
    }
  }

  await ensureSettings(ctx.billingUserId);

  await prisma.$transaction(async (tx) => {
    const keptIds: number[] = [];

    for (let i = 0; i < parsed.data.locations.length; i++) {
      const L = parsed.data.locations[i]!;

      if (L.id != null) {
        await tx.attendanceShift.deleteMany({ where: { locationId: L.id } });
        await tx.attendanceLocation.update({
          where: { id: L.id },
          data: {
            name: L.name,
            allowedLocationLat: L.allowedLocationLat,
            allowedLocationLng: L.allowedLocationLng,
            radiusMeters: L.radiusMeters,
            sortOrder: i,
          },
        });
        for (let j = 0; j < L.shifts.length; j++) {
          const sh = L.shifts[j]!;
          await tx.attendanceShift.create({
            data: {
              locationId: L.id,
              startTime: normalizeHhmm(sh.startTime),
              endTime: normalizeHhmm(sh.endTime),
              sortOrder: j,
            },
          });
        }
        keptIds.push(L.id);
      } else {
        const created = await tx.attendanceLocation.create({
          data: {
            ownerUserId: ctx.billingUserId,
            name: L.name,
            allowedLocationLat: L.allowedLocationLat,
            allowedLocationLng: L.allowedLocationLng,
            radiusMeters: L.radiusMeters,
            sortOrder: i,
            shifts: {
              create: L.shifts.map((sh, j) => ({
                startTime: normalizeHhmm(sh.startTime),
                endTime: normalizeHhmm(sh.endTime),
                sortOrder: j,
              })),
            },
          },
        });
        keptIds.push(created.id);
      }
    }

    await tx.attendanceLocation.deleteMany({
      where: {
        ownerUserId: ctx.billingUserId,
        ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
      },
    });
  });

  await syncAttendanceSettingsMirrorFromPrimaryLocation(ctx.billingUserId);

  const locations = await prisma.attendanceLocation.findMany({
    where: { ownerUserId: ctx.billingUserId },
    orderBy: { sortOrder: "asc" },
    include: { shifts: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({
    ok: true,
    quota,
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      allowedLocationLat: loc.allowedLocationLat,
      allowedLocationLng: loc.allowedLocationLng,
      radiusMeters: loc.radiusMeters,
      sortOrder: loc.sortOrder,
      shifts: loc.shifts.map((sh) => ({
        id: sh.id,
        startTime: sh.startTime,
        endTime: sh.endTime,
        sortOrder: sh.sortOrder,
      })),
    })),
  });
}

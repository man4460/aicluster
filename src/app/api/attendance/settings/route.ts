import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import {
  ATTENDANCE_MAX_RADIUS_METERS,
  ATTENDANCE_MIN_RADIUS_METERS,
} from "@/lib/attendance/constants";
import {
  ATTENDANCE_MAX_SHIFTS_PER_LOCATION,
  attendanceLocationQuotaError,
  getAttendancePlanQuota,
} from "@/lib/attendance/plan-quota";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import {
  ensureAttendanceLocationsFromLegacy,
  syncAttendanceSettingsMirrorFromPrimaryLocation,
} from "@/lib/attendance/location-ensure";
import { normalizeAttendanceBranchCode } from "@/lib/attendance/branch-ensure";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";

const hhmm = z.string().regex(/^\d{1,2}:\d{2}$/);

const shiftInSchema = z.object({
  startTime: hhmm,
  endTime: hhmm,
});

const locationInSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(80),
  allowedLocationLat: z.number().finite(),
  allowedLocationLng: z.number().finite(),
  radiusMeters: z.number().int().min(ATTENDANCE_MIN_RADIUS_METERS).max(ATTENDANCE_MAX_RADIUS_METERS),
  shifts: z.array(shiftInSchema).min(1).max(ATTENDANCE_MAX_SHIFTS_PER_LOCATION),
});

const branchInSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(20),
  address: z.string().trim().max(200).optional().default(""),
  isActive: z.boolean().optional().default(true),
  locations: z.array(locationInSchema).min(1),
});

const putSchema = z.object({
  branches: z.array(branchInSchema).min(1),
  faceCheckInEnabled: z.boolean().optional(),
});

async function ensureSettings(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.attendanceSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
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
      trialSessionId,
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

function mapBranchResponse(
  branches: Array<{
    id: number;
    name: string;
    code: string;
    address: string;
    isActive: boolean;
    sortOrder: number;
    locations: Array<{
      id: number;
      name: string;
      allowedLocationLat: number;
      allowedLocationLng: number;
      radiusMeters: number;
      sortOrder: number;
      shifts: Array<{ id: number; startTime: string; endTime: string; sortOrder: number }>;
    }>;
  }>,
) {
  return branches.map((br) => ({
    id: br.id,
    name: br.name,
    code: br.code,
    address: br.address,
    isActive: br.isActive,
    sortOrder: br.sortOrder,
    locations: br.locations.map((loc) => ({
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
  }));
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  try {
    await ensureSettings(ctx.billingUserId, scope.trialSessionId);
    await ensureAttendanceLocationsFromLegacy(ctx.billingUserId, scope.trialSessionId);

    const boss = await prisma.user.findUnique({
      where: { id: ctx.billingUserId },
      select: { subscriptionType: true, subscriptionTier: true },
    });
    if (!boss) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    const quota = getAttendancePlanQuota(boss.subscriptionType, boss.subscriptionTier, {
      hasModuleMonthly199: ctx.access.monthly199Slugs?.includes(ATTENDANCE_MODULE_SLUG) ?? false,
      isTrialSandbox: scope.isTrialSandbox,
    });

    const branches = await prisma.attendanceBranch.findMany({
      where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId },
      orderBy: { sortOrder: "asc" },
      include: {
        locations: {
          orderBy: { sortOrder: "asc" },
          include: { shifts: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    const settings = await prisma.attendanceSettings.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ctx.billingUserId,
          trialSessionId: scope.trialSessionId,
        },
      },
      select: { faceCheckInEnabled: true },
    });

    const flatLocations = branches.flatMap((b) => b.locations);

    return NextResponse.json({
      quota,
      faceCheckInEnabled: Boolean(settings?.faceCheckInEnabled),
      branches: mapBranchResponse(branches),
      locations: flatLocations.map((loc) => ({
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

  const scope = await getAttendanceDataScope(ctx.billingUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const allLocations = parsed.data.branches.flatMap((b) => b.locations);
  if (allLocations.length === 0) {
    return NextResponse.json({ error: "ต้องมีอย่างน้อย 1 จุดเช็คในองค์กร" }, { status: 400 });
  }

  const branchCodes = parsed.data.branches.map((b) => normalizeAttendanceBranchCode(b.code));
  if (branchCodes.length !== new Set(branchCodes).size) {
    return NextResponse.json({ error: "รหัสสาขาซ้ำ — ใช้รหัสไม่ซ้ำกันในองค์กร" }, { status: 400 });
  }

  const boss = await prisma.user.findUnique({
    where: { id: ctx.billingUserId },
    select: { subscriptionType: true, subscriptionTier: true },
  });
  if (!boss) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const quota = getAttendancePlanQuota(boss.subscriptionType, boss.subscriptionTier, {
    hasModuleMonthly199: ctx.access.monthly199Slugs?.includes(ATTENDANCE_MODULE_SLUG) ?? false,
    isTrialSandbox: scope.isTrialSandbox,
  });

  if (quota.maxLocations != null && allLocations.length > quota.maxLocations) {
    return NextResponse.json({ error: attendanceLocationQuotaError(quota.maxLocations) }, { status: 400 });
  }

  for (const loc of allLocations) {
    if (loc.shifts.length > quota.maxShiftsPerLocation) {
      return NextResponse.json(
        { error: `แต่ละจุดเช็คตั้งกะได้ไม่เกิน ${quota.maxShiftsPerLocation} กะ` },
        { status: 400 },
      );
    }
  }

  const branchIdList = parsed.data.branches.map((b) => b.id).filter((x): x is number => x != null);
  if (branchIdList.length !== new Set(branchIdList).size) {
    return NextResponse.json({ error: "ข้อมูลสาขาซ้ำ" }, { status: 400 });
  }
  if (branchIdList.length > 0) {
    const okBranchCount = await prisma.attendanceBranch.count({
      where: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
        id: { in: branchIdList },
      },
    });
    if (okBranchCount !== branchIdList.length) {
      return NextResponse.json({ error: "รหัสสาขาไม่ถูกต้อง — โหลดหน้าใหม่แล้วลองอีกครั้ง" }, { status: 400 });
    }
  }

  const locIdList = allLocations.map((l) => l.id).filter((x): x is number => x != null);
  if (locIdList.length !== new Set(locIdList).size) {
    return NextResponse.json({ error: "ข้อมูลจุดเช็คซ้ำ" }, { status: 400 });
  }
  if (locIdList.length > 0) {
    const okLocCount = await prisma.attendanceLocation.count({
      where: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
        id: { in: locIdList },
      },
    });
    if (okLocCount !== locIdList.length) {
      return NextResponse.json({ error: "รหัสจุดเช็คไม่ถูกต้อง — โหลดหน้าใหม่แล้วลองอีกครั้ง" }, { status: 400 });
    }
  }

  await ensureSettings(ctx.billingUserId, scope.trialSessionId);

  if (parsed.data.faceCheckInEnabled !== undefined) {
    await prisma.attendanceSettings.update({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ctx.billingUserId,
          trialSessionId: scope.trialSessionId,
        },
      },
      data: { faceCheckInEnabled: parsed.data.faceCheckInEnabled },
    });
  }

  await prisma.$transaction(async (tx) => {
    const keptBranchIds: number[] = [];
    const keptLocIds: number[] = [];
    let globalLocSort = 0;

    for (let bi = 0; bi < parsed.data.branches.length; bi++) {
      const B = parsed.data.branches[bi]!;
      const code = normalizeAttendanceBranchCode(B.code);

      let branchId: number;
      if (B.id != null) {
        await tx.attendanceBranch.update({
          where: { id: B.id },
          data: {
            name: B.name,
            code,
            address: B.address ?? "",
            isActive: B.isActive ?? true,
            sortOrder: bi,
          },
        });
        branchId = B.id;
      } else {
        const created = await tx.attendanceBranch.create({
          data: {
            ownerUserId: ctx.billingUserId,
            trialSessionId: scope.trialSessionId,
            name: B.name,
            code,
            address: B.address ?? "",
            isActive: B.isActive ?? true,
            sortOrder: bi,
          },
        });
        branchId = created.id;
      }
      keptBranchIds.push(branchId);

      for (const L of B.locations) {
        if (L.id != null) {
          await tx.attendanceShift.deleteMany({ where: { locationId: L.id } });
          await tx.attendanceLocation.update({
            where: { id: L.id },
            data: {
              branchId,
              name: L.name,
              allowedLocationLat: L.allowedLocationLat,
              allowedLocationLng: L.allowedLocationLng,
              radiusMeters: L.radiusMeters,
              sortOrder: globalLocSort++,
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
          keptLocIds.push(L.id);
        } else {
          const created = await tx.attendanceLocation.create({
            data: {
              ownerUserId: ctx.billingUserId,
              trialSessionId: scope.trialSessionId,
              branchId,
              name: L.name,
              allowedLocationLat: L.allowedLocationLat,
              allowedLocationLng: L.allowedLocationLng,
              radiusMeters: L.radiusMeters,
              sortOrder: globalLocSort++,
              shifts: {
                create: L.shifts.map((sh, j) => ({
                  startTime: normalizeHhmm(sh.startTime),
                  endTime: normalizeHhmm(sh.endTime),
                  sortOrder: j,
                })),
              },
            },
          });
          keptLocIds.push(created.id);
        }
      }
    }

    await tx.attendanceLocation.deleteMany({
      where: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
        ...(keptLocIds.length > 0 ? { id: { notIn: keptLocIds } } : {}),
      },
    });

    await tx.attendanceBranch.deleteMany({
      where: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
        ...(keptBranchIds.length > 0 ? { id: { notIn: keptBranchIds } } : {}),
      },
    });
  });

  await syncAttendanceSettingsMirrorFromPrimaryLocation(ctx.billingUserId, scope.trialSessionId);

  const branches = await prisma.attendanceBranch.findMany({
    where: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId },
    orderBy: { sortOrder: "asc" },
    include: {
      locations: {
        orderBy: { sortOrder: "asc" },
        include: { shifts: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    quota,
    branches: mapBranchResponse(branches),
  });
}

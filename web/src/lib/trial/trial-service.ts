import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import {
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
} from "@/lib/modules/config";
import { TRIAL_PROD_SCOPE, trialSessionDaysDefault } from "./constants";
import { seedAttendanceTrialData } from "./seed-attendance";
import { seedBarberTrialData } from "./seed-barber";
import { seedBuildingPosTrialData } from "./seed-building-pos";
import { seedCarWashTrialData } from "./seed-car-wash";
import { seedDormitoryTrialData } from "./seed-dorm";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

async function deleteSandboxRowsInTx(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;
  await tx.buildingPosOrder.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.buildingPosMenuItem.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.buildingPosCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.attendanceLog.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.attendanceRosterEntry.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.attendanceLocation.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.attendanceSettings.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.carWashVisit.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.carWashBundle.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.carWashComplaint.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.carWashPackage.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.mqttClientSessionLog.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.mqttMessageStatDaily.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.mqttAclRule.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.mqttCredential.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.mqttTenantProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberServiceLog.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberBooking.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberCustomerSubscription.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberPortalStaffPing.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberCustomer.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberPackage.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberStylist.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.room.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.dormitoryProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
}

export async function expireStaleTrialSessions(): Promise<void> {
  const now = new Date();
  const stale = await prisma.trialSession.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: { id: true, userId: true },
  });
  for (const s of stale) {
    await deleteSandboxRowsForTrialSession(s.userId, s.id);
  }
  if (stale.length > 0) {
    await prisma.trialSession.updateMany({
      where: { id: { in: stale.map((x) => x.id) } },
      data: { status: "EXPIRED" },
    });
  }
}

export async function listTrialModuleIds(userId: string): Promise<string[]> {
  await expireStaleTrialSessions();
  const rows = await prisma.trialSession.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { moduleId: true },
  });
  return [...new Set(rows.map((r) => r.moduleId))];
}

/** ลบข้อมูล sandbox ใน DB สำหรับ sessionId (ไม่ลบ prod) */
export async function deleteSandboxRowsForTrialSession(
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;
  await prisma.$transaction(async (tx) => {
    await deleteSandboxRowsInTx(tx, ownerUserId, trialSessionId);
  });
}

export async function stopTrial(userId: string, moduleId: string): Promise<void> {
  await expireStaleTrialSessions();
  const row = await prisma.trialSession.findFirst({
    where: { userId, moduleId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!row) return;
  await deleteSandboxRowsForTrialSession(userId, row.id);
  await prisma.trialSession.delete({ where: { id: row.id } });
}

export async function startTrial(userId: string, moduleId: string): Promise<void> {
  await expireStaleTrialSessions();
  const mod = await prisma.appModule.findUnique({
    where: { id: moduleId },
    select: { id: true, slug: true },
  });
  if (!mod) throw new Error("MODULE_NOT_FOUND");

  const days = trialSessionDaysDefault();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const previous = await tx.trialSession.findMany({
      where: { userId, moduleId, status: "ACTIVE" },
      select: { id: true },
    });
    for (const p of previous) {
      await deleteSandboxRowsInTx(tx, userId, p.id);
      await tx.trialSession.delete({ where: { id: p.id } });
    }

    const session = await tx.trialSession.create({
      data: {
        userId,
        moduleId,
        status: "ACTIVE",
        expiresAt,
      },
    });

    if (mod.slug === DORMITORY_MODULE_SLUG) {
      await seedDormitoryTrialData(tx, userId, session.id);
    } else if (mod.slug === BARBER_MODULE_SLUG) {
      await seedBarberTrialData(tx, userId, session.id);
    } else if (mod.slug === ATTENDANCE_MODULE_SLUG) {
      await seedAttendanceTrialData(tx, userId, session.id);
    } else if (mod.slug === BUILDING_POS_MODULE_SLUG) {
      await seedBuildingPosTrialData(tx, userId, session.id);
    } else if (mod.slug === CAR_WASH_MODULE_SLUG) {
      await seedCarWashTrialData(tx, userId, session.id);
    }
  });
}

export async function getActiveTrialBanner(
  userId: string,
  moduleSlug: string,
): Promise<{ expiresAt: Date } | null> {
  await expireStaleTrialSessions();
  const mod = await prisma.appModule.findFirst({
    where: { slug: moduleSlug, isActive: true },
    select: { id: true },
  });
  if (!mod) return null;
  const subscribed = await listSubscribedModuleIds(userId);
  if (subscribed.includes(mod.id)) return null;

  const row = await prisma.trialSession.findFirst({
    where: {
      userId,
      moduleId: mod.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { expiresAt: true },
  });
  return row ? { expiresAt: row.expiresAt } : null;
}


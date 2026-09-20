import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  ATTENDANCE_MODULE_SLUG,
  SMART_GUARD_TOUR_MODULE_SLUG,
} from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";

async function resolveDutyLink(params: {
  shopId: string;
  staffId: string;
  shiftOn: string;
}): Promise<{ postDutyId: string; templateId: string } | null> {
  const duty = await prisma.smartGuardPostDuty.findFirst({
    where: {
      shopId: params.shopId,
      staffId: params.staffId,
      dutyOn: params.shiftOn,
      status: { notIn: ["CANCELLED", "ABSENT"] },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, templateId: true },
  });
  if (!duty) return null;
  return { postDutyId: duty.id, templateId: duty.templateId };
}

export type AttendanceBridgeLog = {
  id: number;
  ownerUserId: string;
  trialSessionId: string;
  actorUserId: string | null;
  guestPhone: string | null;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  checkInLocationId: number | null;
  checkOutLocationId: number | null;
};

function digitsPhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 20);
}

async function ownerHasBothModules(ownerUserId: string): Promise<boolean> {
  const mods = await prisma.appModule.findMany({
    where: {
      slug: { in: [ATTENDANCE_MODULE_SLUG, SMART_GUARD_TOUR_MODULE_SLUG] },
      isActive: true,
    },
    select: { id: true },
  });
  if (mods.length < 2) return false;

  const user = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return true;

  const [subscribed, trial] = await Promise.all([
    listSubscribedModuleIds(ownerUserId),
    listTrialModuleIds(ownerUserId),
  ]);
  const access = new Set([...subscribed, ...trial]);
  return mods.every((m) => access.has(m.id));
}

async function resolvePhoneForLog(log: AttendanceBridgeLog): Promise<string | null> {
  const guest = digitsPhone(log.guestPhone);
  if (guest.length >= 9) return guest;
  if (!log.actorUserId) return null;
  const actor = await prisma.user.findUnique({
    where: { id: log.actorUserId },
    select: { phone: true },
  });
  const aphone = digitsPhone(actor?.phone);
  return aphone.length >= 9 ? aphone : null;
}

async function locationPassesShopFilter(params: {
  locationId: number | null | undefined;
  attendanceBranchId: number | null;
  attendanceLocationId: number | null;
}): Promise<boolean> {
  const { locationId, attendanceBranchId, attendanceLocationId } = params;
  if (attendanceLocationId == null && attendanceBranchId == null) return true;
  if (locationId == null || locationId <= 0) {
    // ไม่มีจุดบนล็อก — ผ่านเฉพาะเมื่อไม่ได้กรองจุด/สาขา
    return attendanceLocationId == null && attendanceBranchId == null;
  }
  if (attendanceLocationId != null && locationId !== attendanceLocationId) return false;
  if (attendanceBranchId == null) return true;
  const loc = await prisma.attendanceLocation.findUnique({
    where: { id: locationId },
    select: { branchId: true },
  });
  return loc?.branchId === attendanceBranchId;
}

async function resolveGuardStaffId(params: {
  shopId: string;
  ownerUserId: string;
  trialSessionId: string;
  phone: string | null;
  requireMatch: boolean;
}): Promise<string | null> {
  const { shopId, ownerUserId, trialSessionId, phone, requireMatch } = params;

  if (phone) {
    const roster = await prisma.attendanceRosterEntry.findFirst({
      where: { ownerUserId, trialSessionId, phone, isActive: true },
      select: { id: true },
    });
    if (roster) {
      const link = await prisma.smartGuardAttendanceStaffLink.findUnique({
        where: { shopId_rosterEntryId: { shopId, rosterEntryId: roster.id } },
        select: { guardStaffId: true },
      });
      if (link) return link.guardStaffId;
    }
  }

  if (requireMatch) return null;
  if (!phone) return null;

  const all = await prisma.smartGuardStaff.findMany({
    where: { shopId, isActive: true },
    select: { id: true, phone: true },
  });
  const hit = all.find((s) => digitsPhone(s.phone) === phone);
  return hit?.id ?? null;
}

/**
 * หลังเช็คอิน/เอาต์สำเร็จ — ซิงก์ SmartGuardShiftLog เมื่อเปิดสะพาน
 * ไม่ throw ออกไปยัง attendance (กลืน error แล้ว log)
 */
export async function syncSmartGuardShiftFromAttendance(params: {
  ownerUserId: string;
  trialSessionId: string;
  log: AttendanceBridgeLog;
  action: "in" | "out";
}): Promise<void> {
  try {
    await syncSmartGuardShiftFromAttendanceInner(params);
  } catch (e) {
    console.error("[smart-guard-tour/attendance-bridge]", e);
  }
}

async function syncSmartGuardShiftFromAttendanceInner(params: {
  ownerUserId: string;
  trialSessionId: string;
  log: AttendanceBridgeLog;
  action: "in" | "out";
}): Promise<void> {
  const { ownerUserId, trialSessionId, log, action } = params;
  if (log.ownerUserId !== ownerUserId || log.trialSessionId !== trialSessionId) return;

  const hasBoth = await ownerHasBothModules(ownerUserId);
  if (!hasBoth) return;

  const shop = await prisma.smartGuardShop.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
    select: {
      id: true,
      attendanceLinkEnabled: true,
      attendanceBranchId: true,
      attendanceLocationId: true,
      attendanceRequireMatch: true,
    },
  });
  if (!shop?.attendanceLinkEnabled) return;

  const locId = action === "in" ? log.checkInLocationId : log.checkOutLocationId ?? log.checkInLocationId;
  const okLoc = await locationPassesShopFilter({
    locationId: locId,
    attendanceBranchId: shop.attendanceBranchId,
    attendanceLocationId: shop.attendanceLocationId,
  });
  if (!okLoc) return;

  const phone = await resolvePhoneForLog(log);
  const staffId = await resolveGuardStaffId({
    shopId: shop.id,
    ownerUserId,
    trialSessionId,
    phone,
    requireMatch: shop.attendanceRequireMatch,
  });
  if (!staffId) return;

  const at = action === "in" ? log.checkInTime : log.checkOutTime;
  if (!at) return;
  const shiftOn = bangkokDateKey(at);

  if (action === "in") {
    const existing = await prisma.smartGuardShiftLog.findFirst({
      where: {
        shopId: shop.id,
        staffId,
        shiftOn,
        checkOutAt: null,
      },
      orderBy: { id: "desc" },
    });
    if (existing) {
      if (!existing.checkInAt) {
        await prisma.smartGuardShiftLog.update({
          where: { id: existing.id },
          data: { checkInAt: at },
        });
      }
      return;
    }
    const sameDay = await prisma.smartGuardShiftLog.findFirst({
      where: { shopId: shop.id, staffId, shiftOn },
      orderBy: { id: "desc" },
    });
    if (sameDay?.checkInAt && !sameDay.checkOutAt) return;
    if (sameDay?.checkInAt && sameDay.checkOutAt) {
      // มีกะปิดแล้ววันนี้ — ไม่สร้างซ้ำจากเช็คอินซ้ำ
      return;
    }
    const dutyLink = await resolveDutyLink({ shopId: shop.id, staffId, shiftOn });
    await prisma.smartGuardShiftLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        shopId: shop.id,
        staffId,
        shiftOn,
        checkInAt: at,
        note: `attendance:${log.id}`,
        ...(dutyLink
          ? { postDutyId: dutyLink.postDutyId, templateId: dutyLink.templateId }
          : {}),
      },
    });
    return;
  }

  // out
  const open = await prisma.smartGuardShiftLog.findFirst({
    where: {
      shopId: shop.id,
      staffId,
      shiftOn,
      checkOutAt: null,
    },
    orderBy: { id: "desc" },
  });
  if (!open) return;

  let patch: {
    checkOutAt: Date;
    note: string;
    postDutyId?: string;
    templateId?: string;
  } = {
    checkOutAt: at,
    note: open.note?.includes(`attendance:${log.id}`)
      ? open.note
      : [open.note, `attendance-out:${log.id}`].filter(Boolean).join(" · ").slice(0, 500),
  };
  if (!open.postDutyId || !open.templateId) {
    const dutyLink = await resolveDutyLink({ shopId: shop.id, staffId, shiftOn });
    if (dutyLink) {
      patch = {
        ...patch,
        postDutyId: open.postDutyId ?? dutyLink.postDutyId,
        templateId: open.templateId ?? dutyLink.templateId,
      };
    }
  }

  await prisma.smartGuardShiftLog.update({
    where: { id: open.id },
    data: patch,
  });
  // ค่าแรงนับจากกะที่จัดเวร — ไม่คำนวณจากเวลาเช็คเอาท์
}

/** ใช้ใน UI ตั้งค่า — มีสิทธิ์โมดูลเช็คอินหรือไม่ */
export async function ownerHasAttendanceModule(ownerUserId: string): Promise<boolean> {
  const mod = await prisma.appModule.findFirst({
    where: { slug: ATTENDANCE_MODULE_SLUG, isActive: true },
    select: { id: true },
  });
  if (!mod) return false;
  const user = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return true;
  const [subscribed, trial] = await Promise.all([
    listSubscribedModuleIds(ownerUserId),
    listTrialModuleIds(ownerUserId),
  ]);
  return subscribed.includes(mod.id) || trial.includes(mod.id);
}

/** สถานะอ่านอย่างเดียวฝั่งเช็คอิน */
export async function getSmartGuardAttendanceBridgeStatus(params: {
  ownerUserId: string;
  trialSessionId: string;
}): Promise<{ linked: boolean; shopDisplayName: string | null }> {
  const shop = await prisma.smartGuardShop.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: params.ownerUserId,
        trialSessionId: params.trialSessionId,
      },
    },
    select: { displayName: true, attendanceLinkEnabled: true },
  });
  if (!shop?.attendanceLinkEnabled) return { linked: false, shopDisplayName: null };
  const hasBoth = await ownerHasBothModules(params.ownerUserId);
  if (!hasBoth) return { linked: false, shopDisplayName: null };
  return { linked: true, shopDisplayName: shop.displayName };
}

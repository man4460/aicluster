import { prisma } from "@/lib/prisma";
import {
  ATTENDANCE_MODULE_SLUG,
  SMART_GUARD_TOUR_MODULE_SLUG,
} from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";

export type StaffSyncFields = {
  displayName: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

function digitsPhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 20);
}

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digitsPhone(a);
  const db = digitsPhone(b);
  if (!da && !db) return true;
  return da.length >= 9 && da === db;
}

function fieldsEqual(a: StaffSyncFields, b: StaffSyncFields): boolean {
  return (
    a.displayName.trim() === b.displayName.trim() &&
    samePhone(a.phone, b.phone) &&
    (a.photoUrl ?? null) === (b.photoUrl ?? null) &&
    a.isActive === b.isActive
  );
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

async function ensureLink(params: {
  ownerUserId: string;
  trialSessionId: string;
  shopId: string;
  guardStaffId: string;
  rosterEntryId: number;
}): Promise<void> {
  const existing = await prisma.smartGuardAttendanceStaffLink.findFirst({
    where: {
      shopId: params.shopId,
      OR: [{ guardStaffId: params.guardStaffId }, { rosterEntryId: params.rosterEntryId }],
    },
  });
  if (existing) {
    if (
      existing.guardStaffId === params.guardStaffId &&
      existing.rosterEntryId === params.rosterEntryId
    ) {
      return;
    }
    // ลิงก์เก่าชน — ลบแล้วสร้างใหม่ให้คู่ตรง
    await prisma.smartGuardAttendanceStaffLink.deleteMany({
      where: {
        shopId: params.shopId,
        OR: [{ guardStaffId: params.guardStaffId }, { rosterEntryId: params.rosterEntryId }],
      },
    });
  }
  await prisma.smartGuardAttendanceStaffLink.create({
    data: {
      ownerUserId: params.ownerUserId,
      trialSessionId: params.trialSessionId,
      shopId: params.shopId,
      guardStaffId: params.guardStaffId,
      rosterEntryId: params.rosterEntryId,
    },
  });
}

async function applyFieldsToGuard(
  guardStaffId: string,
  fields: StaffSyncFields,
): Promise<boolean> {
  const row = await prisma.smartGuardStaff.findUnique({
    where: { id: guardStaffId },
    select: { displayName: true, phone: true, photoUrl: true, isActive: true },
  });
  if (!row) return false;
  const current: StaffSyncFields = {
    displayName: row.displayName,
    phone: row.phone,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
  };
  if (fieldsEqual(current, fields)) return false;
  const phone = digitsPhone(fields.phone);
  await prisma.smartGuardStaff.update({
    where: { id: guardStaffId },
    data: {
      displayName: fields.displayName.trim().slice(0, 200),
      phone: phone.length >= 9 ? phone : fields.phone?.trim().slice(0, 32) || null,
      photoUrl: fields.photoUrl,
      isActive: fields.isActive,
    },
  });
  return true;
}

async function applyFieldsToRoster(
  rosterEntryId: number,
  fields: StaffSyncFields,
): Promise<boolean> {
  const row = await prisma.attendanceRosterEntry.findUnique({
    where: { id: rosterEntryId },
    select: { displayName: true, phone: true, photoUrl: true, isActive: true },
  });
  if (!row) return false;
  const current: StaffSyncFields = {
    displayName: row.displayName,
    phone: row.phone,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
  };
  if (fieldsEqual(current, fields)) return false;
  const phone = digitsPhone(fields.phone);
  if (phone.length < 9) {
    // roster บังคับเบอร์ — อัปเดตเฉพาะชื่อ/รูป/สถานะ
    await prisma.attendanceRosterEntry.update({
      where: { id: rosterEntryId },
      data: {
        displayName: fields.displayName.trim().slice(0, 100),
        photoUrl: fields.photoUrl,
        isActive: fields.isActive,
      },
    });
    return true;
  }
  await prisma.attendanceRosterEntry.update({
    where: { id: rosterEntryId },
    data: {
      displayName: fields.displayName.trim().slice(0, 100),
      phone,
      photoUrl: fields.photoUrl,
      isActive: fields.isActive,
    },
  });
  return true;
}

/**
 * หลังแก้รายชื่อเช็คอิน — ดันไป SmartGuardStaff ของร้านที่เปิดลิงก์
 */
export async function syncStaffAfterRosterChange(params: {
  ownerUserId: string;
  trialSessionId: string;
  rosterEntryId: number;
}): Promise<void> {
  try {
    await syncStaffAfterRosterChangeInner(params);
  } catch (e) {
    console.error("[smart-guard-tour/staff-sync] roster→guard", e);
  }
}

async function syncStaffAfterRosterChangeInner(params: {
  ownerUserId: string;
  trialSessionId: string;
  rosterEntryId: number;
}): Promise<void> {
  const { ownerUserId, trialSessionId, rosterEntryId } = params;
  if (!(await ownerHasBothModules(ownerUserId))) return;

  const roster = await prisma.attendanceRosterEntry.findFirst({
    where: { id: rosterEntryId, ownerUserId, trialSessionId },
  });
  if (!roster) return;

  const shops = await prisma.smartGuardShop.findMany({
    where: { ownerUserId, trialSessionId, attendanceLinkEnabled: true },
    select: { id: true },
  });
  if (shops.length === 0) return;

  const fields: StaffSyncFields = {
    displayName: roster.displayName,
    phone: roster.phone,
    photoUrl: roster.photoUrl,
    isActive: roster.isActive,
  };
  const phone = digitsPhone(roster.phone);

  for (const shop of shops) {
    let link = await prisma.smartGuardAttendanceStaffLink.findUnique({
      where: { shopId_rosterEntryId: { shopId: shop.id, rosterEntryId: roster.id } },
    });

    if (!link && phone.length >= 9) {
      const byPhone = await prisma.smartGuardStaff.findMany({
        where: { shopId: shop.id },
        select: { id: true, phone: true },
      });
      const hit = byPhone.find((s) => digitsPhone(s.phone) === phone);
      if (hit) {
        await ensureLink({
          ownerUserId,
          trialSessionId,
          shopId: shop.id,
          guardStaffId: hit.id,
          rosterEntryId: roster.id,
        });
        link = await prisma.smartGuardAttendanceStaffLink.findUnique({
          where: { shopId_rosterEntryId: { shopId: shop.id, rosterEntryId: roster.id } },
        });
      }
    }

    if (link) {
      await applyFieldsToGuard(link.guardStaffId, fields);
      continue;
    }

    const created = await prisma.smartGuardStaff.create({
      data: {
        ownerUserId,
        trialSessionId,
        shopId: shop.id,
        displayName: fields.displayName.trim().slice(0, 200),
        phone: phone.length >= 9 ? phone : null,
        photoUrl: fields.photoUrl,
        isActive: fields.isActive,
      },
    });
    await ensureLink({
      ownerUserId,
      trialSessionId,
      shopId: shop.id,
      guardStaffId: created.id,
      rosterEntryId: roster.id,
    });
  }
}

/**
 * หลังแก้พนักงานจุดตรวจ — ดันไป AttendanceRosterEntry
 */
export async function syncStaffAfterGuardChange(params: {
  shopId: string;
  guardStaffId: string;
}): Promise<void> {
  try {
    await syncStaffAfterGuardChangeInner(params);
  } catch (e) {
    console.error("[smart-guard-tour/staff-sync] guard→roster", e);
  }
}

async function syncStaffAfterGuardChangeInner(params: {
  shopId: string;
  guardStaffId: string;
}): Promise<void> {
  const shop = await prisma.smartGuardShop.findUnique({
    where: { id: params.shopId },
    select: {
      id: true,
      ownerUserId: true,
      trialSessionId: true,
      attendanceLinkEnabled: true,
    },
  });
  if (!shop?.attendanceLinkEnabled) return;
  if (!(await ownerHasBothModules(shop.ownerUserId))) return;

  const guard = await prisma.smartGuardStaff.findFirst({
    where: { id: params.guardStaffId, shopId: shop.id },
  });
  if (!guard) return;

  const fields: StaffSyncFields = {
    displayName: guard.displayName,
    phone: guard.phone,
    photoUrl: guard.photoUrl,
    isActive: guard.isActive,
  };
  const phone = digitsPhone(guard.phone);

  let link = await prisma.smartGuardAttendanceStaffLink.findUnique({
    where: { shopId_guardStaffId: { shopId: shop.id, guardStaffId: guard.id } },
  });

  if (!link && phone.length >= 9) {
    const roster = await prisma.attendanceRosterEntry.findFirst({
      where: {
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
        phone,
      },
    });
    if (roster) {
      await ensureLink({
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
        shopId: shop.id,
        guardStaffId: guard.id,
        rosterEntryId: roster.id,
      });
      link = await prisma.smartGuardAttendanceStaffLink.findUnique({
        where: { shopId_guardStaffId: { shopId: shop.id, guardStaffId: guard.id } },
      });
    }
  }

  if (link) {
    await applyFieldsToRoster(link.rosterEntryId, fields);
    return;
  }

  if (phone.length < 9) return; // roster ต้องมีเบอร์

  const clash = await prisma.attendanceRosterEntry.findFirst({
    where: {
      ownerUserId: shop.ownerUserId,
      trialSessionId: shop.trialSessionId,
      phone,
    },
    select: { id: true },
  });
  if (clash) {
    await ensureLink({
      ownerUserId: shop.ownerUserId,
      trialSessionId: shop.trialSessionId,
      shopId: shop.id,
      guardStaffId: guard.id,
      rosterEntryId: clash.id,
    });
    await applyFieldsToRoster(clash.id, fields);
    return;
  }

  const created = await prisma.attendanceRosterEntry.create({
    data: {
      ownerUserId: shop.ownerUserId,
      trialSessionId: shop.trialSessionId,
      displayName: fields.displayName.trim().slice(0, 100),
      phone,
      photoUrl: fields.photoUrl,
      isActive: fields.isActive,
      rosterShiftIndex: 0,
    },
  });
  await ensureLink({
    ownerUserId: shop.ownerUserId,
    trialSessionId: shop.trialSessionId,
    shopId: shop.id,
    guardStaffId: guard.id,
    rosterEntryId: created.id,
  });
}

export type FullStaffSyncResult = {
  matched: number;
  createdGuards: number;
  createdRoster: number;
  updated: number;
};

/**
 * ซิงค์ครบสำหรับร้านที่เปิดลิงก์ — จับคู่เบอร์ · สร้างคู่ที่ขาด · อัปเดตฟิลด์
 */
export async function runFullStaffSyncForShop(shopId: string): Promise<FullStaffSyncResult> {
  const empty: FullStaffSyncResult = {
    matched: 0,
    createdGuards: 0,
    createdRoster: 0,
    updated: 0,
  };
  try {
    return await runFullStaffSyncForShopInner(shopId);
  } catch (e) {
    console.error("[smart-guard-tour/staff-sync] full", e);
    return empty;
  }
}

async function runFullStaffSyncForShopInner(shopId: string): Promise<FullStaffSyncResult> {
  const result: FullStaffSyncResult = {
    matched: 0,
    createdGuards: 0,
    createdRoster: 0,
    updated: 0,
  };

  const shop = await prisma.smartGuardShop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      ownerUserId: true,
      trialSessionId: true,
      attendanceLinkEnabled: true,
    },
  });
  if (!shop?.attendanceLinkEnabled) return result;
  if (!(await ownerHasBothModules(shop.ownerUserId))) return result;

  const [guards, roster] = await Promise.all([
    prisma.smartGuardStaff.findMany({ where: { shopId: shop.id } }),
    prisma.attendanceRosterEntry.findMany({
      where: {
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
      },
    }),
  ]);

  const rosterByPhone = new Map<string, (typeof roster)[0]>();
  for (const r of roster) {
    const p = digitsPhone(r.phone);
    if (p.length >= 9 && !rosterByPhone.has(p)) rosterByPhone.set(p, r);
  }

  const linkedRosterIds = new Set<number>();
  const linkedGuardIds = new Set<string>();

  // 1) จับคู่เบอร์ที่มีอยู่ทั้งสองฝั่ง
  for (const g of guards) {
    const p = digitsPhone(g.phone);
    if (p.length < 9) continue;
    const r = rosterByPhone.get(p);
    if (!r) continue;
    await ensureLink({
      ownerUserId: shop.ownerUserId,
      trialSessionId: shop.trialSessionId,
      shopId: shop.id,
      guardStaffId: g.id,
      rosterEntryId: r.id,
    });
    linkedGuardIds.add(g.id);
    linkedRosterIds.add(r.id);
    result.matched += 1;
    // ใช้ roster เป็นค่าตั้งต้นเมื่อเปิดซิงค์ครั้งแรก (ชื่อ/รูป/สถานะ)
    const fields: StaffSyncFields = {
      displayName: r.displayName,
      phone: r.phone,
      photoUrl: r.photoUrl,
      isActive: r.isActive,
    };
    if (await applyFieldsToGuard(g.id, fields)) result.updated += 1;
  }

  // 2) roster ที่ยังไม่มีคู่ → สร้าง guard
  for (const r of roster) {
    if (linkedRosterIds.has(r.id)) continue;
    const p = digitsPhone(r.phone);
    const created = await prisma.smartGuardStaff.create({
      data: {
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
        shopId: shop.id,
        displayName: r.displayName.slice(0, 200),
        phone: p.length >= 9 ? p : null,
        photoUrl: r.photoUrl,
        isActive: r.isActive,
      },
    });
    await ensureLink({
      ownerUserId: shop.ownerUserId,
      trialSessionId: shop.trialSessionId,
      shopId: shop.id,
      guardStaffId: created.id,
      rosterEntryId: r.id,
    });
    linkedGuardIds.add(created.id);
    linkedRosterIds.add(r.id);
    result.createdGuards += 1;
  }

  // 3) guard ที่มีเบอร์และยังไม่มีคู่ → สร้าง roster
  for (const g of guards) {
    if (linkedGuardIds.has(g.id)) continue;
    const p = digitsPhone(g.phone);
    if (p.length < 9) continue;
    if (rosterByPhone.has(p)) {
      // มี roster แล้วแต่ยังไม่ลิงก์ (ควรจับในขั้น 1) — ข้าม
      continue;
    }
    const created = await prisma.attendanceRosterEntry.create({
      data: {
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
        displayName: g.displayName.slice(0, 100),
        phone: p,
        photoUrl: g.photoUrl,
        isActive: g.isActive,
        rosterShiftIndex: 0,
      },
    });
    await ensureLink({
      ownerUserId: shop.ownerUserId,
      trialSessionId: shop.trialSessionId,
      shopId: shop.id,
      guardStaffId: g.id,
      rosterEntryId: created.id,
    });
    linkedGuardIds.add(g.id);
    linkedRosterIds.add(created.id);
    result.createdRoster += 1;
  }

  // 4) ลิงก์ที่มีอยู่แล้ว — ดึงฟิลด์ให้ตรง (roster → guard)
  const links = await prisma.smartGuardAttendanceStaffLink.findMany({
    where: { shopId: shop.id },
    include: {
      rosterEntry: {
        select: { displayName: true, phone: true, photoUrl: true, isActive: true },
      },
    },
  });
  for (const link of links) {
    const fields: StaffSyncFields = {
      displayName: link.rosterEntry.displayName,
      phone: link.rosterEntry.phone,
      photoUrl: link.rosterEntry.photoUrl,
      isActive: link.rosterEntry.isActive,
    };
    if (await applyFieldsToGuard(link.guardStaffId, fields)) result.updated += 1;
  }

  return result;
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { prisma } from "@/lib/prisma";
import { ownerHasAttendanceModule } from "@/systems/smart-guard-tour/lib/attendance-bridge";
import { runFullStaffSyncForShop } from "@/systems/smart-guard-tour/lib/staff-sync";

function digitsPhone(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 20);
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
    const hasAttendance = await ownerHasAttendanceModule(own.ownerId);

    const [links, guardStaff, roster, branches] = await Promise.all([
      prisma.smartGuardAttendanceStaffLink.findMany({
        where: { shopId: shop.id },
        select: {
          id: true,
          guardStaffId: true,
          rosterEntryId: true,
          guardStaff: { select: { displayName: true, phone: true } },
          rosterEntry: { select: { displayName: true, phone: true, isActive: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.smartGuardStaff.findMany({
        where: { shopId: shop.id, isActive: true },
        select: { id: true, displayName: true, phone: true },
        orderBy: { displayName: "asc" },
      }),
      hasAttendance
        ? prisma.attendanceRosterEntry.findMany({
            where: {
              ownerUserId: own.ownerId,
              trialSessionId: scope.trialSessionId,
              isActive: true,
            },
            select: { id: true, displayName: true, phone: true, homeBranchId: true },
            orderBy: { displayName: "asc" },
          })
        : Promise.resolve([]),
      hasAttendance
        ? prisma.attendanceBranch.findMany({
            where: {
              ownerUserId: own.ownerId,
              trialSessionId: scope.trialSessionId,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              code: true,
              locations: {
                select: { id: true, name: true },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      hasAttendance,
      shopId: shop.id,
      attendanceLinkEnabled: shop.attendanceLinkEnabled,
      attendanceBranchId: shop.attendanceBranchId,
      attendanceLocationId: shop.attendanceLocationId,
      attendanceRequireMatch: shop.attendanceRequireMatch,
      links: links.map((l) => ({
        id: l.id,
        guardStaffId: l.guardStaffId,
        rosterEntryId: l.rosterEntryId,
        guardName: l.guardStaff.displayName,
        guardPhone: l.guardStaff.phone,
        rosterName: l.rosterEntry.displayName,
        rosterPhone: l.rosterEntry.phone,
      })),
      guardStaff,
      roster,
      branches,
    });
  } catch (e) {
    console.error("[smart-guard-tour/session/attendance-links GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

type LinkRow = { guardStaffId: string; rosterEntryId: number };

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);

    const hasAttendance = await ownerHasAttendanceModule(own.ownerId);
    if (!hasAttendance) {
      return NextResponse.json({ error: "ยังไม่ได้สมัครเช็คอินอัจฉริยะ" }, { status: 400 });
    }

    const body = (await req.json()) as {
      links?: LinkRow[];
      autoMatch?: boolean;
      syncStaff?: boolean;
    };

    if (body.syncStaff === true) {
      if (!shop.attendanceStaffSyncEnabled) {
        return NextResponse.json(
          { error: "เปิดซิงค์ข้อมูลพนักงานในตั้งค่าก่อน" },
          { status: 400 },
        );
      }
      const result = await runFullStaffSyncForShop(shop.id);
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.autoMatch === true) {
      const [staff, roster] = await Promise.all([
        prisma.smartGuardStaff.findMany({
          where: { shopId: shop.id, isActive: true },
          select: { id: true, phone: true },
        }),
        prisma.attendanceRosterEntry.findMany({
          where: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            isActive: true,
          },
          select: { id: true, phone: true },
        }),
      ]);
      const byPhone = new Map<string, number>();
      for (const r of roster) {
        const p = digitsPhone(r.phone);
        if (p.length >= 9 && !byPhone.has(p)) byPhone.set(p, r.id);
      }
      const matched: LinkRow[] = [];
      const usedRoster = new Set<number>();
      for (const s of staff) {
        const p = digitsPhone(s.phone);
        if (p.length < 9) continue;
        const rid = byPhone.get(p);
        if (rid == null || usedRoster.has(rid)) continue;
        usedRoster.add(rid);
        matched.push({ guardStaffId: s.id, rosterEntryId: rid });
      }
      await replaceLinks(shop.id, own.ownerId, scope.trialSessionId, matched);
      return NextResponse.json({ ok: true, matched: matched.length });
    }

    const rawLinks = Array.isArray(body.links) ? body.links : null;
    if (!rawLinks) {
      return NextResponse.json({ error: "ต้องส่ง links หรือ autoMatch" }, { status: 400 });
    }

    const cleaned: LinkRow[] = [];
    const seenStaff = new Set<string>();
    const seenRoster = new Set<number>();
    for (const row of rawLinks) {
      if (!row || typeof row.guardStaffId !== "string") continue;
      if (typeof row.rosterEntryId !== "number" || !Number.isInteger(row.rosterEntryId)) continue;
      if (seenStaff.has(row.guardStaffId) || seenRoster.has(row.rosterEntryId)) continue;
      seenStaff.add(row.guardStaffId);
      seenRoster.add(row.rosterEntryId);
      cleaned.push({ guardStaffId: row.guardStaffId, rosterEntryId: row.rosterEntryId });
    }

    if (cleaned.length > 0) {
      const staffOk = await prisma.smartGuardStaff.count({
        where: {
          shopId: shop.id,
          id: { in: cleaned.map((c) => c.guardStaffId) },
        },
      });
      const rosterOk = await prisma.attendanceRosterEntry.count({
        where: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          id: { in: cleaned.map((c) => c.rosterEntryId) },
        },
      });
      if (staffOk !== cleaned.length || rosterOk !== cleaned.length) {
        return NextResponse.json({ error: "แม็ปพนักงานไม่ถูกต้อง" }, { status: 400 });
      }
    }

    await replaceLinks(shop.id, own.ownerId, scope.trialSessionId, cleaned);
    return NextResponse.json({ ok: true, count: cleaned.length });
  } catch (e) {
    console.error("[smart-guard-tour/session/attendance-links PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

async function replaceLinks(
  shopId: string,
  ownerUserId: string,
  trialSessionId: string,
  links: LinkRow[],
) {
  await prisma.$transaction(async (tx) => {
    await tx.smartGuardAttendanceStaffLink.deleteMany({ where: { shopId } });
    if (links.length === 0) return;
    await tx.smartGuardAttendanceStaffLink.createMany({
      data: links.map((l) => ({
        ownerUserId,
        trialSessionId,
        shopId,
        guardStaffId: l.guardStaffId,
        rosterEntryId: l.rosterEntryId,
      })),
    });
  });
}

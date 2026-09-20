import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";

function dec(v: { toString(): string } | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
    const base = {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      shopId: shop.id,
    };
    const today = bangkokDateKey();
    const month = bangkokMonthKey();

    const [checkpoints, schedules, incidents, contacts, assets, tourLogs, shifts, ledger] =
      await Promise.all([
        prisma.smartGuardCheckpoint.findMany({
          where: base,
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: { _count: { select: { videos: true } } },
        }),
        prisma.smartGuardSchedule.findMany({
          where: base,
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
        }),
        prisma.smartGuardIncident.findMany({
          where: base,
          orderBy: [{ createdAt: "desc" }],
          take: 80,
          include: {
            checkpoint: { select: { name: true } },
            staff: { select: { displayName: true } },
            contact: { select: { displayName: true } },
            _count: { select: { images: true } },
          },
        }),
        prisma.smartGuardContact.findMany({
          where: base,
          orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
        }),
        prisma.smartGuardAsset.findMany({
          where: base,
          orderBy: [{ name: "asc" }],
        }),
        prisma.smartGuardTourLog.findMany({
          where: base,
          orderBy: [{ entryOn: "desc" }, { createdAt: "desc" }],
          take: 100,
          include: {
            checkpoint: { select: { name: true, zoneLabel: true } },
            staff: { select: { displayName: true } },
            schedule: { select: { name: true } },
          },
        }),
        prisma.smartGuardShiftLog.findMany({
          where: base,
          orderBy: [{ shiftOn: "desc" }, { checkInAt: "desc" }],
          take: 80,
          include: {
            staff: { select: { displayName: true, phone: true } },
            template: { select: { name: true, startHm: true, endHm: true, shiftRateBaht: true } },
            postDuty: {
              select: {
                post: { select: { name: true } },
                template: { select: { name: true, startHm: true, endHm: true, shiftRateBaht: true } },
              },
            },
            workSpans: {
              take: 1,
              select: {
                clockMinutes: true,
                normalMinutes: true,
                otMinutes: true,
                wageNormalBaht: true,
                wageOtBaht: true,
                totalBaht: true,
                flagsJson: true,
              },
            },
          },
        }),
        prisma.smartGuardLedgerEntry.findMany({
          where: base,
          orderBy: [{ entryOn: "desc" }, { createdAt: "desc" }],
          take: 120,
          include: {
            category: { select: { name: true, kind: true } },
            staff: { select: { displayName: true } },
            asset: { select: { name: true } },
          },
        }),
      ]);

    let incomeBaht = 0;
    let expenseBaht = 0;
    for (const row of ledger) {
      if (row.kind === "INCOME") incomeBaht += row.amountBaht;
      else expenseBaht += row.amountBaht;
    }

    return NextResponse.json({
      today,
      month,
      checkpoints: checkpoints.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        zoneLabel: c.zoneLabel,
        buildingLabel: c.buildingLabel,
        floorLabel: c.floorLabel,
        lat: dec(c.lat),
        lng: dec(c.lng),
        geofenceRadiusM: c.geofenceRadiusM,
        coverImageUrl: c.coverImageUrl,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        videoCount: c._count.videos,
      })),
      schedules: schedules.map((s) => {
        let checkpointCount = 0;
        try {
          const ids = JSON.parse(s.checkpointIdsJson) as unknown;
          if (Array.isArray(ids)) checkpointCount = ids.length;
        } catch {
          /* ignore */
        }
        return {
          id: s.id,
          name: s.name,
          routeMode: s.routeMode,
          intervalMinutes: s.intervalMinutes,
          checkpointCount,
          isActive: s.isActive,
        };
      }),
      incidents: incidents.map((r) => ({
        id: r.id,
        title: r.title,
        kind: r.kind,
        status: r.status,
        severity: r.severity,
        detail: r.detail,
        checkpointName: r.checkpoint?.name ?? null,
        staffName: r.staff?.displayName ?? null,
        contactName: r.contact?.displayName ?? null,
        imageCount: r._count.images,
        resolvedNote: r.resolvedNote,
        createdAt: r.createdAt.toISOString(),
      })),
      contacts: contacts.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        phone: c.phone,
        lineId: c.lineId,
        isActive: c.isActive,
      })),
      assets: assets.map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind,
        assetCode: a.assetCode,
        status: a.status,
      })),
      tourLogs: tourLogs.map((t) => ({
        id: t.id,
        status: t.status,
        entryOn: t.entryOn,
        scannedAt: t.scannedAt?.toISOString() ?? null,
        photoUrl: t.photoUrl,
        checkpointName: t.checkpoint?.name ?? "—",
        zoneLabel: t.checkpoint?.zoneLabel ?? null,
        staffName: t.staff?.displayName ?? null,
        scheduleName: t.schedule?.name ?? null,
        scanLat: dec(t.scanLat),
        scanLng: dec(t.scanLng),
      })),
      shifts: shifts.map((s) => {
        const span = s.workSpans[0] ?? null;
        let flags: string[] = [];
        try {
          const parsed = JSON.parse(span?.flagsJson ?? "[]") as unknown;
          if (Array.isArray(parsed)) flags = parsed.map(String);
        } catch {
          /* ignore */
        }
        const tpl = s.postDuty?.template ?? s.template;
        return {
          id: s.id,
          shiftOn: s.shiftOn,
          checkInAt: s.checkInAt?.toISOString() ?? null,
          checkOutAt: s.checkOutAt?.toISOString() ?? null,
          staffName: s.staff.displayName,
          staffPhone: s.staff.phone,
          onDuty: Boolean(s.checkInAt && !s.checkOutAt),
          clockMinutes: span?.clockMinutes ?? null,
          normalMinutes: span?.normalMinutes ?? null,
          otMinutes: span?.otMinutes ?? null,
          wageNormalBaht: span?.wageNormalBaht ?? null,
          wageOtBaht: span?.wageOtBaht ?? null,
          totalBaht: span?.totalBaht ?? null,
          weeklyNormalExceeded: flags.includes("WEEKLY_NORMAL_EXCEEDED"),
          missingHourlyRate: flags.includes("MISSING_SHIFT_RATE"),
          missingDuty: flags.includes("MISSING_DUTY") || !tpl,
          missingShiftRate: flags.includes("MISSING_SHIFT_RATE"),
          postName: s.postDuty?.post.name ?? null,
          templateName: tpl?.name ?? null,
          templateHm: tpl ? `${tpl.startHm}–${tpl.endHm}` : null,
          shiftRateBaht: tpl?.shiftRateBaht ?? null,
        };
      }),
      ledger: ledger.map((e) => ({
        id: e.id,
        kind: e.kind,
        title: e.title,
        amountBaht: e.amountBaht,
        entryOn: e.entryOn,
        paymentMethod: e.paymentMethod,
        slipImageUrl: e.slipImageUrl,
        categoryName: e.category?.name ?? null,
        staffName: e.staff?.displayName ?? null,
        assetName: e.asset?.name ?? null,
      })),
      financeSummary: {
        incomeBaht,
        expenseBaht,
        netBaht: incomeBaht - expenseBaht,
        entryCount: ledger.length,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/session/catalog GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

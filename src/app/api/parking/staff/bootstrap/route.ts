import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parkingStaffDailyPinStatus, requireParkingStaff } from "@/lib/parking/staff-auth";

export async function GET(req: Request) {
  const auth = await requireParkingStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const pin = await parkingStaffDailyPinStatus(req, ctx.ownerId);
  const sites = await prisma.parkingSite.findMany({
    where: { ownerUserId: ctx.ownerId, trialSessionId: ctx.trialSessionId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      logoUrl: true,
      pricingMode: true,
      dailyRateBaht: true,
      monthlyRateBaht: true,
    },
  });
  const siteIds = sites.map((site) => site.id);
  const spots = await prisma.parkingSpot.findMany({
    where: { siteId: { in: siteIds } },
    orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    include: {
      site: { select: { id: true, name: true, pricingMode: true, dailyRateBaht: true, monthlyRateBaht: true } },
      sessions: { where: { status: "ACTIVE" }, take: 1, orderBy: { checkInAt: "desc" } },
    },
  });
  const primary = sites[0];
  const activeCount = spots.reduce((sum, spot) => sum + (spot.sessions[0] ? 1 : 0), 0);
  return NextResponse.json({
    ok: true,
    requiresDailyPin: pin.requiresDailyPin,
    unlocked: pin.unlocked,
    shopLabel: primary?.name?.trim() || "ลานจอดรถ",
    logoUrl: primary?.logoUrl ?? null,
    stats: { spots: spots.length, active: activeCount, available: Math.max(0, spots.length - activeCount) },
    lots: sites.map((site) => ({ id: site.id, name: site.name, isActive: site.isActive })),
    spots: spots.map((spot) => {
      const active = spot.sessions[0];
      return {
        id: spot.id,
        siteId: spot.site.id,
        siteName: spot.site.name,
        spotCode: spot.spotCode,
        zoneLabel: spot.zoneLabel,
        pricingMode: spot.site.pricingMode,
        dailyRateBaht: spot.site.dailyRateBaht == null ? null : Number(spot.site.dailyRateBaht),
        monthlyRateBaht: spot.site.monthlyRateBaht == null ? null : Number(spot.site.monthlyRateBaht),
        activeSession: active
          ? {
              id: active.id,
              licensePlate: active.licensePlate,
              checkInAt: active.checkInAt.toISOString(),
              customerName: active.customerName,
              customerPhone: active.customerPhone,
              selfCheckIn: active.selfCheckIn,
              shuttleFrom: active.shuttleFrom,
              shuttleTo: active.shuttleTo,
              shuttleNote: active.shuttleNote,
            }
          : null,
      };
    }),
  });
}

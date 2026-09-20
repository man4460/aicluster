import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";
import { mapSmartGuardShop } from "@/systems/smart-guard-tour/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { scope, shop } = await smartGuardTourSessionContext(own.ownerId);
    const today = bangkokDateKey();
    const month = bangkokMonthKey();
    const base = {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      shopId: shop.id,
    };

    const [
      checkpointCount,
      tourLogTodayCount,
      incidentOpenCount,
      staffOnShiftCount,
      scheduleTodayCount,
      assetCount,
    ] = await Promise.all([
      prisma.smartGuardCheckpoint.count({ where: { ...base, isActive: true } }),
      prisma.smartGuardTourLog.count({ where: { ...base, entryOn: today } }),
      prisma.smartGuardIncident.count({
        where: { ...base, status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      prisma.smartGuardShiftLog.count({
        where: { ...base, shiftOn: today, checkInAt: { not: null }, checkOutAt: null },
      }),
      prisma.smartGuardSchedule.count({ where: { ...base, isActive: true } }),
      prisma.smartGuardAsset.count({ where: base }),
    ]);

    return NextResponse.json({
      shop: mapSmartGuardShop(shop),
      stats: {
        checkpointCount,
        tourLogTodayCount,
        incidentOpenCount,
        staffOnShiftCount,
        scheduleTodayCount,
        assetCount,
      },
      today,
      month,
    });
  } catch (e) {
    console.error("[smart-guard-tour/session/overview GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

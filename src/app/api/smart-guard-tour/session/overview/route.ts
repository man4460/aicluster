import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";
import { mapSmartGuardShop } from "@/systems/smart-guard-tour/lib/mappers";

/** Phase A — สถิติศูนย์ + ร้าน (รายละเอียดจริงในเฟสถัดไป) */
export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const today = bangkokDateKey();
    const month = bangkokMonthKey();

    return NextResponse.json({
      shop: mapSmartGuardShop(shop),
      stats: {
        checkpointCount: 0,
        tourLogTodayCount: 0,
        incidentOpenCount: 0,
        staffOnShiftCount: 0,
        scheduleTodayCount: 0,
        assetCount: 0,
      },
      today,
      month,
    });
  } catch (e) {
    console.error("[smart-guard-tour/session/overview GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

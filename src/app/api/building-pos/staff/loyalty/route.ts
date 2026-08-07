import { NextResponse } from "next/server";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import {
  ensureBuildingPosLoyaltySettings,
  formatBuildingPosLoyaltyEarnRule,
  listBuildingPosLoyaltyRewards,
} from "@/systems/building-pos/lib/loyalty";

/** GET — ตั้งค่าคะแนน + รายการแลก (ลิงก์พนักงาน) */
export async function GET(req: Request) {
  try {
    const ctx = await resolveBuildingPosStaffFromUrl(new URL(req.url));
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const settings = await ensureBuildingPosLoyaltySettings(ctx.ownerId, ctx.trialSessionId);
    const rewards = await listBuildingPosLoyaltyRewards(ctx.ownerId, ctx.trialSessionId, {
      activeOnly: true,
    });
    return NextResponse.json({
      settings,
      rule_preview: formatBuildingPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
      rewards,
    });
  } catch (e) {
    console.error("[building-pos/staff/loyalty GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

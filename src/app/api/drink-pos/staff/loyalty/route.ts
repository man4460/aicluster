import { NextResponse } from "next/server";
import { requireDrinkPosStaff } from "@/lib/drink-pos/staff-auth";
import {
  ensureDrinkPosLoyaltySettings,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
} from "@/systems/drink-pos/lib/loyalty";

export async function GET(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;
  const settings = await ensureDrinkPosLoyaltySettings(ctx.ownerId, ctx.trialSessionId);
  const rewards = await listDrinkPosLoyaltyRewards(ctx.ownerId, ctx.trialSessionId);
  return NextResponse.json({
    settings,
    rule_preview: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
    rewards,
  });
}

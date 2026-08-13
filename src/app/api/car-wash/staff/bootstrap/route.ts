import { NextResponse } from "next/server";
import {
  carWashStaffDailyPinStatus,
  requireCarWashStaff,
} from "@/lib/car-wash/staff-auth";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";

export async function GET(req: Request) {
  const auth = await requireCarWashStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const pinStatus = await carWashStaffDailyPinStatus(req, ctx.ownerId);
  const branding = await getModuleShopBranding(ctx.ownerId, ctx.trialSessionId, CAR_WASH_MODULE_SLUG);
  const shopLabel = branding.displayName?.trim() || "คาร์แคร์";
  const logoUrl = branding.logoUrl?.trim() || null;

  if (pinStatus.requiresDailyPin && !pinStatus.unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      shopLabel,
      logoUrl,
      trialSessionId: ctx.trialSessionId,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin: pinStatus.requiresDailyPin,
    unlocked: true,
    shopLabel,
    logoUrl,
    trialSessionId: ctx.trialSessionId,
  });
}

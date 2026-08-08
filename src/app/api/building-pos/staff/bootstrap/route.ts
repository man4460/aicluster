import { NextResponse } from "next/server";
import { getQrBuildingPosBranding } from "@/lib/profile/qr-branding";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { loadBuildingPosStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";
import { prisma } from "@/lib/prisma";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ctx = await resolveBuildingPosStaffFromUrl(url);
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const scope = await getBuildingPosDataScope(ctx.ownerId);
  const trialSessionId = ctx.trialSessionId || scope.trialSessionId;
  const pinHash = await loadBuildingPosStaffDailyPinHash(ctx.ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "building-pos",
      ownerId: ctx.ownerId,
    });

  const [branding, modulePayment, owner, policy] = await Promise.all([
    getQrBuildingPosBranding(ctx.ownerId, trialSessionId),
    resolveModulePayment(ctx.ownerId, trialSessionId, BUILDING_POS_MODULE_SLUG),
    prisma.user.findUnique({
      where: { id: ctx.ownerId },
      select: { role: true, subscriptionType: true, subscriptionTier: true },
    }),
    getPlanFeaturePolicy(),
  ]);

  if (requiresDailyPin && !unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      shopLabel: branding.label,
      logoUrl: branding.logoUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin,
    unlocked: true,
    shopLabel: branding.label,
    logoUrl: branding.logoUrl,
    paymentChannelsNote: modulePayment.paymentChannelsNote,
    features: owner
      ? planFeaturesApiPayload(owner, policy)
      : planFeaturesApiPayload(
          { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE" },
          policy,
        ),
  });
}

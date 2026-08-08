import { NextResponse } from "next/server";
import { getQrDrinkPosBranding } from "@/lib/profile/qr-branding";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { prisma } from "@/lib/prisma";
import { drinkPosStaffDailyPinStatus, requireDrinkPosStaff } from "@/lib/drink-pos/staff-auth";

export async function GET(req: Request) {
  const auth = await requireDrinkPosStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;
  const pinStatus = await drinkPosStaffDailyPinStatus(req, ctx.ownerId);

  const [branding, owner, policy, shop] = await Promise.all([
    getQrDrinkPosBranding(ctx.ownerId, ctx.trialSessionId),
    prisma.user.findUnique({
      where: { id: ctx.ownerId },
      select: { role: true, subscriptionType: true, subscriptionTier: true },
    }),
    getPlanFeaturePolicy(),
    prisma.drinkPosShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: ctx.ownerId, trialSessionId: ctx.trialSessionId },
      },
      select: {
        displayName: true,
        logoUrl: true,
        address: true,
        taxId: true,
        contactPhone: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        slipPaperSize: true,
        orderTicketSlipPaperSize: true,
      },
    }),
  ]);
  const shopLabel = shop?.displayName?.trim() || branding.label || "ร้านเครื่องดื่ม";
  const slipPaperSize = normalizeModuleSlipPaperSize(shop?.slipPaperSize);
  const orderTicketSlipPaperSize = normalizeModuleSlipPaperSize(shop?.orderTicketSlipPaperSize);

  if (pinStatus.requiresDailyPin && !pinStatus.unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      shopLabel,
      logoUrl: shop?.logoUrl?.trim() || branding.logoUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin: pinStatus.requiresDailyPin,
    unlocked: true,
    shopLabel,
    logoUrl: shop?.logoUrl?.trim() || branding.logoUrl,
    trialSessionId: ctx.trialSessionId,
    defaultPaperSize: slipPaperSize,
    slipPaperSize,
    orderTicketSlipPaperSize,
    receipt: {
      shopLabel,
      logoUrl: shop?.logoUrl?.trim() || branding.logoUrl,
      address: shop?.address?.trim() || null,
      taxId: shop?.taxId?.trim() || null,
      contactPhone: shop?.contactPhone?.trim() || null,
      bankName: shop?.bankName?.trim() || null,
      bankAccountNumber: shop?.bankAccountNumber?.trim() || null,
      bankAccountName: shop?.bankAccountName?.trim() || null,
      slipPaperSize,
      orderTicketSlipPaperSize,
    },
    features: owner
      ? planFeaturesApiPayload(owner, policy)
      : planFeaturesApiPayload(
          { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE" },
          policy,
        ),
  });
}

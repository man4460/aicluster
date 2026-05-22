import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";
import { isLoyaltyStampPortalOpenForOwner } from "@/lib/loyalty-stamp/portal-access";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const trialParam = url.searchParams.get("t")?.trim();
  if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isLoyaltyStampPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะชั่วคราว" }, { status: 403 });

  const scope = await resolveDataScopeBySlug(ownerId, LOYALTY_STAMP_MODULE_SLUG);
  const trialSessionId = trialParam && trialParam.length > 0 ? trialParam : scope.trialSessionId;

  const profile = await prisma.loyaltyStampShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
  });
  if (!profile || !profile.publicCardEnabled) {
    return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะ" }, { status: 403 });
  }

  return NextResponse.json({
    shop: {
      displayName: profile.displayName?.trim() || "ร้านสะสมแต้ม",
      tagline: profile.tagline,
      stampsPerReward: profile.stampsPerReward,
      rewardTitle: profile.rewardTitle,
      rewardDescription: profile.rewardDescription,
      stampEmoji: profile.stampEmoji,
    },
  });
}

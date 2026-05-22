import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const trialParam = url.searchParams.get("t")?.trim();
  if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ร้านปิดการ์ดสาธารณะชั่วคราว" }, { status: 403 });

  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId = trialParam && trialParam.length > 0 ? trialParam : scope.trialSessionId;
  const profile = await ensureDrinkPosShopProfile(prisma, ownerId, trialSessionId);

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { username: true, email: true },
  });
  const displayName =
    owner?.username?.trim() || owner?.email?.split("@")[0]?.trim() || "ร้านเครื่องดื่ม";

  return NextResponse.json({
    shop: {
      displayName,
      stampsPerReward: profile.stampsPerReward,
      rewardTitle: profile.rewardTitle,
      stampEmoji: "☕",
    },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ctx = await resolveBuildingPosStaffFromUrl(url);
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
  const [profile, dormPay] = await Promise.all([
    getBusinessProfile(ctx.ownerId),
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: ctx.ownerId, trialSessionId: TRIAL_PROD_SCOPE },
      },
      select: { paymentChannelsNote: true },
    }),
  ]);
  return NextResponse.json({
    ok: true,
    shopLabel: profile?.name?.trim() || "POS ร้านอาหาร",
    logoUrl: profile?.logoUrl?.trim() || null,
    paymentChannelsNote: dormPay?.paymentChannelsNote?.trim() || null,
  });
}

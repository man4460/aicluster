import { NextResponse } from "next/server";
import { getQrBuildingPosBranding } from "@/lib/profile/qr-branding";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ctx = await resolveBuildingPosStaffFromUrl(url);
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
  const scope = await getBuildingPosDataScope(ctx.ownerId);
  const [branding, modulePayment] = await Promise.all([
    getQrBuildingPosBranding(ctx.ownerId, scope.trialSessionId),
    resolveModulePayment(ctx.ownerId, ctx.trialSessionId, BUILDING_POS_MODULE_SLUG),
  ]);
  return NextResponse.json({
    ok: true,
    shopLabel: branding.label,
    logoUrl: branding.logoUrl,
    paymentChannelsNote: modulePayment.paymentChannelsNote,
  });
}

import { NextResponse } from "next/server";
import { getQrDormitoryBranding } from "@/lib/profile/qr-branding";
import {
  dormitoryStaffDailyPinStatus,
  requireDormitoryStaff,
} from "@/lib/dormitory/staff-auth";

export async function GET(req: Request) {
  const auth = await requireDormitoryStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const pinStatus = await dormitoryStaffDailyPinStatus(req, ctx.ownerId);
  const branding = await getQrDormitoryBranding(ctx.ownerId, ctx.trialSessionId);

  if (pinStatus.requiresDailyPin && !pinStatus.unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      dormLabel: branding.label,
      logoUrl: branding.logoUrl,
      trialSessionId: ctx.trialSessionId,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin: pinStatus.requiresDailyPin,
    unlocked: true,
    dormLabel: branding.label,
    logoUrl: branding.logoUrl,
    trialSessionId: ctx.trialSessionId,
  });
}

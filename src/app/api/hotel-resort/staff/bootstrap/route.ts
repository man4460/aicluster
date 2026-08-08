import { NextResponse } from "next/server";
import { getQrHotelResortBranding } from "@/lib/profile/qr-branding";
import {
  hotelResortStaffDailyPinStatus,
  requireHotelResortStaff,
} from "@/lib/hotel-resort/staff-auth";

export async function GET(req: Request) {
  const auth = await requireHotelResortStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const pinStatus = await hotelResortStaffDailyPinStatus(req, ctx.ownerId);
  const branding = await getQrHotelResortBranding(ctx.ownerId, ctx.trialSessionId);

  if (pinStatus.requiresDailyPin && !pinStatus.unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      hotelLabel: branding.label,
      logoUrl: branding.logoUrl,
      trialSessionId: ctx.trialSessionId,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin: pinStatus.requiresDailyPin,
    unlocked: true,
    hotelLabel: branding.label,
    logoUrl: branding.logoUrl,
    trialSessionId: ctx.trialSessionId,
  });
}

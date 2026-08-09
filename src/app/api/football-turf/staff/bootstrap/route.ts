import { NextResponse } from "next/server";
import {
  footballTurfStaffDailyPinStatus,
  requireFootballTurfStaff,
} from "@/lib/football-turf/staff-auth";
import { prisma } from "@/lib/prisma";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";

export async function GET(req: Request) {
  const auth = await requireFootballTurfStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  await ensureFootballTurfProfile(ctx.ownerId, ctx.trialSessionId);
  const pinStatus = await footballTurfStaffDailyPinStatus(req, ctx.ownerId);
  const profile = await prisma.footballTurfShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ctx.ownerId,
        trialSessionId: ctx.trialSessionId,
      },
    },
    select: { venueName: true, logoUrl: true },
  });
  const venueLabel = profile?.venueName?.trim() || "สนามฟุตบอล";
  const logoUrl = profile?.logoUrl?.trim() || null;

  if (pinStatus.requiresDailyPin && !pinStatus.unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      venueLabel,
      logoUrl,
      trialSessionId: ctx.trialSessionId,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin: pinStatus.requiresDailyPin,
    unlocked: true,
    venueLabel,
    logoUrl,
    trialSessionId: ctx.trialSessionId,
  });
}

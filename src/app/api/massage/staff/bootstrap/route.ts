import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getQrMassageBranding } from "@/lib/profile/qr-branding";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { loadMassageStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getMassageDataScope(auth.session.sub);
  const ownerId = auth.session.sub;
  const pinHash = await loadMassageStaffDailyPinHash(ownerId, scope.trialSessionId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlockToken = readStaffDailyUnlockFromRequest(req);
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(unlockToken, { module: "massage", ownerId });

  const branding = await getQrMassageBranding(ownerId, scope.trialSessionId);
  const shopLabel = branding.label || "ร้านนวด";

  if (requiresDailyPin && !unlocked) {
    return NextResponse.json({
      ok: true,
      requiresDailyPin: true,
      unlocked: false,
      shopLabel,
      ownerId,
    });
  }

  return NextResponse.json({
    ok: true,
    requiresDailyPin,
    unlocked: true,
    shopLabel,
    ownerId,
  });
}

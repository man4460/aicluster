import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getQrLaundryBranding } from "@/lib/profile/qr-branding";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { loadLaundryStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getLaundryDataScope(auth.session.sub);
  const ownerId = auth.session.sub;
  const pinHash = await loadLaundryStaffDailyPinHash(ownerId, scope.trialSessionId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlockToken = readStaffDailyUnlockFromRequest(req);
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(unlockToken, { module: "laundry", ownerId });

  const branding = await getQrLaundryBranding(ownerId, scope.trialSessionId);
  const shopLabel = branding.label || "รับฝากซักผ้า";

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

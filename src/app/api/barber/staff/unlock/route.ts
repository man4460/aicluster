import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import {
  handleStaffDailyUnlockPost,
  loadBarberStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getBarberDataScope(auth.session.sub);
  const pinHash = await loadBarberStaffDailyPinHash(auth.session.sub, scope.trialSessionId);
  return handleStaffDailyUnlockPost({
    req,
    module: "barber",
    ownerId: auth.session.sub,
    pinHash,
  });
}

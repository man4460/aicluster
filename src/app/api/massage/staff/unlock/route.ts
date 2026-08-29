import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import {
  handleStaffDailyUnlockPost,
  loadMassageStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getMassageDataScope(auth.session.sub);
  const pinHash = await loadMassageStaffDailyPinHash(auth.session.sub, scope.trialSessionId);
  return handleStaffDailyUnlockPost({
    req,
    module: "massage",
    ownerId: auth.session.sub,
    pinHash,
  });
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import {
  handleStaffDailyUnlockPost,
  loadLaundryStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getLaundryDataScope(auth.session.sub);
  const pinHash = await loadLaundryStaffDailyPinHash(auth.session.sub, scope.trialSessionId);
  return handleStaffDailyUnlockPost({
    req,
    module: "laundry",
    ownerId: auth.session.sub,
    pinHash,
  });
}

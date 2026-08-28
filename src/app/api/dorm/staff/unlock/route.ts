import { NextResponse } from "next/server";
import {
  handleStaffDailyUnlockPost,
  loadDormitoryStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import { requireDormitoryStaff } from "@/lib/dormitory/staff-auth";

export async function POST(req: Request) {
  const auth = await requireDormitoryStaff(req, { skipDailyPin: true });
  if ("error" in auth) return auth.error;
  const pinHash = await loadDormitoryStaffDailyPinHash(auth.ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "dormitory",
    ownerId: auth.ctx.ownerId,
    pinHash,
  });
}

import { NextResponse } from "next/server";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";
import {
  handleStaffDailyUnlockPost,
  loadBuildingPosStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const ctx = await resolveBuildingPosStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const pinHash = await loadBuildingPosStaffDailyPinHash(ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "building-pos",
    ownerId: ctx.ownerId,
    pinHash,
  });
}

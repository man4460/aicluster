import { NextResponse } from "next/server";
import { resolveDrinkPosStaffFromUrl } from "@/lib/drink-pos/staff-request";
import {
  handleStaffDailyUnlockPost,
  loadDrinkPosStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const ctx = await resolveDrinkPosStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const pinHash = await loadDrinkPosStaffDailyPinHash(ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "drink-pos",
    ownerId: ctx.ownerId,
    pinHash,
  });
}

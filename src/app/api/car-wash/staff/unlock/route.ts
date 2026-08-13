import { NextResponse } from "next/server";
import { resolveCarWashStaffFromUrl } from "@/lib/car-wash/staff-request";
import {
  handleStaffDailyUnlockPost,
  loadCarWashStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const ctx = await resolveCarWashStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const pinHash = await loadCarWashStaffDailyPinHash(ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "car-wash",
    ownerId: ctx.ownerId,
    pinHash,
  });
}

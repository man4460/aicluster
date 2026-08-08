import { NextResponse } from "next/server";
import { resolveHotelResortStaffFromUrl } from "@/lib/hotel-resort/staff-request";
import {
  handleStaffDailyUnlockPost,
  loadHotelResortStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const ctx = await resolveHotelResortStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const pinHash = await loadHotelResortStaffDailyPinHash(ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "hotel-resort",
    ownerId: ctx.ownerId,
    pinHash,
  });
}

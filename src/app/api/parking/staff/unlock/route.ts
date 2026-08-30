import { NextResponse } from "next/server";
import { resolveParkingStaffFromUrl } from "@/lib/parking/staff-request";
import {
  handleStaffDailyUnlockPost,
  loadParkingStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const ctx = await resolveParkingStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const pinHash = await loadParkingStaffDailyPinHash(ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "parking",
    ownerId: ctx.ownerId,
    pinHash,
  });
}

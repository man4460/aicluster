import { NextResponse } from "next/server";
import { resolveFootballTurfStaffFromUrl } from "@/lib/football-turf/staff-request";
import {
  handleStaffDailyUnlockPost,
  loadFootballTurfStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";

export async function POST(req: Request) {
  const ctx = await resolveFootballTurfStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 });
  const pinHash = await loadFootballTurfStaffDailyPinHash(ctx.ownerId);
  return handleStaffDailyUnlockPost({
    req,
    module: "football-turf",
    ownerId: ctx.ownerId,
    pinHash,
  });
}

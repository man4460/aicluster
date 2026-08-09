import { NextResponse } from "next/server";
import { resolveFootballTurfStaffFromUrl } from "@/lib/football-turf/staff-request";
import type { FootballTurfStaffContext } from "@/lib/football-turf/staff-request";
import {
  gateStaffDailyPin,
  loadFootballTurfStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";

export async function requireFootballTurfStaff(
  req: Request,
  opts?: { skipDailyPin?: boolean },
): Promise<{ ctx: FootballTurfStaffContext } | { error: NextResponse }> {
  const ctx = await resolveFootballTurfStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  if (!opts?.skipDailyPin) {
    const pinHash = await loadFootballTurfStaffDailyPinHash(ctx.ownerId);
    const blocked = await gateStaffDailyPin(req, "football-turf", ctx.ownerId, pinHash);
    if (blocked) return { error: blocked };
  }
  return { ctx };
}

export async function footballTurfStaffDailyPinStatus(req: Request, ownerId: string) {
  const pinHash = await loadFootballTurfStaffDailyPinHash(ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "football-turf",
      ownerId,
    });
  return { requiresDailyPin, unlocked, pinHash };
}

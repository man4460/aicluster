import { NextResponse } from "next/server";
import { resolveCarWashStaffFromUrl } from "@/lib/car-wash/staff-request";
import type { CarWashStaffContext } from "@/lib/car-wash/staff-request";
import {
  gateStaffDailyPin,
  loadCarWashStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";

export async function requireCarWashStaff(
  req: Request,
  opts?: { skipDailyPin?: boolean },
): Promise<{ ctx: CarWashStaffContext } | { error: NextResponse }> {
  const ctx = await resolveCarWashStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  if (!opts?.skipDailyPin) {
    const pinHash = await loadCarWashStaffDailyPinHash(ctx.ownerId);
    const blocked = await gateStaffDailyPin(req, "car-wash", ctx.ownerId, pinHash);
    if (blocked) return { error: blocked };
  }
  return { ctx };
}

export async function carWashStaffDailyPinStatus(req: Request, ownerId: string) {
  const pinHash = await loadCarWashStaffDailyPinHash(ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "car-wash",
      ownerId,
    });
  return { requiresDailyPin, unlocked, pinHash };
}

import { NextResponse } from "next/server";
import { resolveParkingStaffFromUrl, type ParkingStaffContext } from "@/lib/parking/staff-request";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import {
  gateStaffDailyPin,
  loadParkingStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";

export async function requireParkingStaff(
  req: Request,
  opts?: { skipDailyPin?: boolean },
): Promise<{ ctx: ParkingStaffContext } | { error: NextResponse }> {
  const ctx = await resolveParkingStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, PARKING_MODULE_SLUG);
  if (!charge.ok) {
    return { error: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
  }
  if (!opts?.skipDailyPin) {
    const pinHash = await loadParkingStaffDailyPinHash(ctx.ownerId);
    const blocked = await gateStaffDailyPin(req, "parking", ctx.ownerId, pinHash);
    if (blocked) return { error: blocked };
  }
  return { ctx };
}

export async function parkingStaffDailyPinStatus(req: Request, ownerId: string) {
  const pinHash = await loadParkingStaffDailyPinHash(ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "parking",
      ownerId,
    });
  return { requiresDailyPin, unlocked, pinHash };
}

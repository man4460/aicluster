import { NextResponse } from "next/server";
import { resolveHotelResortStaffFromUrl } from "@/lib/hotel-resort/staff-request";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import {
  gateStaffDailyPin,
  loadHotelResortStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";
import type { HotelResortStaffContext } from "@/lib/hotel-resort/staff-request";

export async function requireHotelResortStaff(
  req: Request,
  opts?: { skipDailyPin?: boolean },
): Promise<{ ctx: HotelResortStaffContext } | { error: NextResponse }> {
  const ctx = await resolveHotelResortStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, HOTEL_RESORT_MODULE_SLUG);
  if (!charge.ok) {
    return { error: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
  }
  if (!opts?.skipDailyPin) {
    const pinHash = await loadHotelResortStaffDailyPinHash(ctx.ownerId);
    const blocked = await gateStaffDailyPin(req, "hotel-resort", ctx.ownerId, pinHash);
    if (blocked) return { error: blocked };
  }
  return { ctx };
}

export async function hotelResortStaffDailyPinStatus(req: Request, ownerId: string) {
  const pinHash = await loadHotelResortStaffDailyPinHash(ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "hotel-resort",
      ownerId,
    });
  return { requiresDailyPin, unlocked, pinHash };
}

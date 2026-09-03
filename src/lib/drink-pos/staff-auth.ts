import { NextResponse } from "next/server";
import { resolveDrinkPosStaffFromUrl } from "@/lib/drink-pos/staff-request";
import { DRINK_POS_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import {
  gateStaffDailyPin,
  handleStaffDailyUnlockPost,
  loadDrinkPosStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import { verifyStaffDailyUnlockToken, readStaffDailyUnlockFromRequest } from "@/lib/modules/staff-daily-pin";
import type { DrinkPosStaffContext } from "@/lib/drink-pos/staff-request";

export async function requireDrinkPosStaff(
  req: Request,
  opts?: { skipDailyPin?: boolean },
): Promise<{ ctx: DrinkPosStaffContext } | { error: NextResponse }> {
  const ctx = await resolveDrinkPosStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, DRINK_POS_MODULE_SLUG);
  if (!charge.ok) {
    return { error: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
  }
  if (!opts?.skipDailyPin) {
    const pinHash = await loadDrinkPosStaffDailyPinHash(ctx.ownerId);
    const blocked = await gateStaffDailyPin(req, "drink-pos", ctx.ownerId, pinHash);
    if (blocked) return { error: blocked };
  }
  return { ctx };
}

export async function drinkPosStaffDailyPinStatus(req: Request, ownerId: string) {
  const pinHash = await loadDrinkPosStaffDailyPinHash(ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "drink-pos",
      ownerId,
    });
  return { requiresDailyPin, unlocked, pinHash };
}

export { handleStaffDailyUnlockPost, loadDrinkPosStaffDailyPinHash };

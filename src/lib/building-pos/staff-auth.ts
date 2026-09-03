import { NextResponse } from "next/server";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import {
  gateStaffDailyPin,
  loadBuildingPosStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import type { BuildingPosStaffContext } from "@/lib/building-pos/staff-request";

export async function requireBuildingPosStaff(
  req: Request,
): Promise<{ ctx: BuildingPosStaffContext } | { error: NextResponse }> {
  const ctx = await resolveBuildingPosStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, BUILDING_POS_MODULE_SLUG);
  if (!charge.ok) {
    return { error: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
  }
  const pinHash = await loadBuildingPosStaffDailyPinHash(ctx.ownerId);
  const blocked = await gateStaffDailyPin(req, "building-pos", ctx.ownerId, pinHash);
  if (blocked) return { error: blocked };
  return { ctx };
}

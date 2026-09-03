import { NextResponse } from "next/server";
import { resolveDormitoryStaffFromUrl } from "@/lib/dormitory/staff-request";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import {
  gateStaffDailyPin,
  loadDormitoryStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  readStaffDailyUnlockFromRequest,
  verifyStaffDailyUnlockToken,
} from "@/lib/modules/staff-daily-pin";
import type { DormitoryStaffContext } from "@/lib/dormitory/staff-request";

export async function requireDormitoryStaff(
  req: Request,
  opts?: { skipDailyPin?: boolean },
): Promise<{ ctx: DormitoryStaffContext } | { error: NextResponse }> {
  const ctx = await resolveDormitoryStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, DORMITORY_MODULE_SLUG);
  if (!charge.ok) {
    return { error: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
  }
  if (!opts?.skipDailyPin) {
    const pinHash = await loadDormitoryStaffDailyPinHash(ctx.ownerId);
    const blocked = await gateStaffDailyPin(req, "dormitory", ctx.ownerId, pinHash);
    if (blocked) return { error: blocked };
  }
  return { ctx };
}

export async function dormitoryStaffDailyPinStatus(req: Request, ownerId: string) {
  const pinHash = await loadDormitoryStaffDailyPinHash(ownerId);
  const requiresDailyPin = Boolean(pinHash?.trim());
  const unlocked =
    !requiresDailyPin ||
    verifyStaffDailyUnlockToken(readStaffDailyUnlockFromRequest(req), {
      module: "dormitory",
      ownerId,
    });
  return { requiresDailyPin, unlocked, pinHash };
}

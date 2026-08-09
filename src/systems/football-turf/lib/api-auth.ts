import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getFootballTurfDataScope } from "@/lib/trial/module-scopes";
import { requireFootballTurfStaff } from "@/lib/football-turf/staff-auth";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";

export async function getFootballTurfOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const scope = await getFootballTurfDataScope(session.sub);
  const profile = await ensureFootballTurfProfile(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, profile, isStaff: false as const };
}

/**
 * เจ้าของ (session) หรือลิงก์พนักงาน (`ownerId`+`t`+`k`)
 * — ใช้กับ state / action / upload บนพอร์ทัลพนักงาน
 */
export async function getFootballTurfOwnerOrStaffContext(
  req: Request,
): Promise<
  | { ok: true; userId: string; trialSessionId: string; isStaff: boolean }
  | { ok: false; res: NextResponse }
> {
  const owner = await getFootballTurfOwnerContext();
  if (owner) {
    return {
      ok: true,
      userId: owner.userId,
      trialSessionId: owner.scope.trialSessionId,
      isStaff: false,
    };
  }
  const staff = await requireFootballTurfStaff(req);
  if ("error" in staff) return { ok: false, res: staff.error };
  await ensureFootballTurfProfile(staff.ctx.ownerId, staff.ctx.trialSessionId);
  return {
    ok: true,
    userId: staff.ctx.ownerId,
    trialSessionId: staff.ctx.trialSessionId,
    isStaff: true,
  };
}

/** ops ที่พนักงานทำได้ — ภาพรวม / จอง / โปร·ลูกค้า */
export const FOOTBALL_TURF_STAFF_ALLOWED_OPS = new Set([
  "createBooking",
  "updateBooking",
  "deleteBooking",
  "createPromotion",
  "updatePromotion",
  "deletePromotion",
  "createPromotionSale",
  "updatePromotionSale",
  "deletePromotionSale",
  "usePromotionSale",
  "createCustomer",
  "updateCustomer",
  "deleteCustomer",
]);

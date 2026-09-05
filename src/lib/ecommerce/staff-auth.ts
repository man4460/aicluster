import { NextResponse } from "next/server";
import { resolveEcommerceStaffFromUrl, type EcommerceStaffContext } from "@/lib/ecommerce/staff-request";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";

export async function requireEcommerceStaff(
  req: Request,
): Promise<{ ctx: EcommerceStaffContext } | { error: NextResponse }> {
  const ctx = await resolveEcommerceStaffFromUrl(new URL(req.url));
  if (!ctx) {
    return { error: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
  }
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, ECOMMERCE_STORE_MODULE_SLUG);
  if (!charge.ok) {
    return { error: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
  }
  return { ctx };
}

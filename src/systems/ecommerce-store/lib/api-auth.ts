import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { resolveEcommerceStaffFromUrl } from "@/lib/ecommerce/staff-request";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";

export type EcommerceApiContext = {
  ownerUserId: string;
  /** true = เข้าผ่านลิงก์พนักงาน (จำกัดเมนูแดชบอร์ด) */
  viaStaff?: boolean;
};

export async function withEcommerceStoreOwnerContext(): Promise<
  { ok: true; ctx: EcommerceApiContext } | { ok: false; res: NextResponse }
> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const billing = await getModuleBillingContext(auth.session.sub);
  if (!billing) {
    return { ok: false, res: NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 }) };
  }
  if (billing.isStaff) {
    return { ok: false, res: NextResponse.json({ error: "เฉพาะเจ้าของร้าน" }, { status: 403 }) };
  }
  return { ok: true, ctx: { ownerUserId: billing.billingUserId } };
}

/**
 * เจ้าของ (session) หรือพนักงาน (โทเค็นใน query) — สำหรับ API เมนูแดชบอร์ด
 */
export async function withEcommerceStoreOwnerOrStaff(
  req: Request,
): Promise<{ ok: true; ctx: EcommerceApiContext } | { ok: false; res: NextResponse }> {
  const url = new URL(req.url);
  const hasStaffKey = Boolean(url.searchParams.get("k")?.trim() && url.searchParams.get("ownerId")?.trim());
  if (hasStaffKey) {
    const staff = await resolveEcommerceStaffFromUrl(url);
    if (!staff) {
      return { ok: false, res: NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือถูกยกเลิก" }, { status: 401 }) };
    }
    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(staff.ownerId, ECOMMERCE_STORE_MODULE_SLUG);
    if (!charge.ok) {
      return { ok: false, res: NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 }) };
    }
    return { ok: true, ctx: { ownerUserId: staff.ownerId, viaStaff: true } };
  }

  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  try {
    await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  } catch {
    return { ok: false, res: NextResponse.json({ error: "ไม่มีสิทธิ์โมดูล" }, { status: 403 }) };
  }
  const billing = await getModuleBillingContext(auth.session.sub);
  if (!billing) {
    return { ok: false, res: NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 }) };
  }
  if (billing.isStaff) {
    return { ok: false, res: NextResponse.json({ error: "เฉพาะเจ้าของร้าน" }, { status: 403 }) };
  }
  return { ok: true, ctx: { ownerUserId: billing.billingUserId } };
}

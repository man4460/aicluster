import { NextResponse } from "next/server";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

/** ownerUserId ใน DB สำหรับ API ร้านตัดผม — พนักงานใช้บัญชีเจ้าของ */
export async function barberOwnerFromAuth(sessionSub: string): Promise<
  { ok: true; ownerId: string; isStaff: boolean } | { ok: false; response: NextResponse }
> {
  const ctx = await getModuleBillingContext(sessionSub);
  if (!ctx) {
    return { ok: false, response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 }) };
  }
  return { ok: true, ownerId: ctx.billingUserId, isStaff: ctx.isStaff };
}

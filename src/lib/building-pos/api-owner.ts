import { NextResponse } from "next/server";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

export async function buildingPosOwnerFromAuth(sessionSub: string): Promise<
  { ok: true; ownerId: string } | { ok: false; response: NextResponse }
> {
  const ctx = await getModuleBillingContext(sessionSub);
  if (!ctx) {
    return { ok: false, response: NextResponse.json({ error: "ไม่มีสิทธิ์เข้าใช้" }, { status: 403 }) };
  }
  if (ctx.isStaff) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "บัญชีพนักงานไม่สามารถใช้ POS ได้ — โปรดเข้าด้วยบัญชีเจ้าของ" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, ownerId: ctx.billingUserId };
}

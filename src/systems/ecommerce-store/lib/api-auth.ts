import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

export type EcommerceApiContext = { ownerUserId: string };

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

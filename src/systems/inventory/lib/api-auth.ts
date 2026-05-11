import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

export type InventoryApiContext = {
  ownerUserId: string;
};

/** ใช้กับทุก API ของคลังสต๊อก — อนุญาตเฉพาะเจ้าขององค์กร (ไม่ใช่ staff) */
export async function withInventoryOwnerContext(): Promise<
  | { ok: true; ctx: InventoryApiContext }
  | { ok: false; res: NextResponse }
> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) {
    return { ok: false, res: NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 }) };
  }
  if (ctx.isStaff) {
    return {
      ok: false,
      res: NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 }),
    };
  }
  return {
    ok: true,
    ctx: { ownerUserId: ctx.billingUserId },
  };
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getAssetDataScope } from "@/lib/trial/module-scopes";

export type AssetApiContext = {
  ownerUserId: string;
  trialSessionId: string;
};

/** ใช้กับทุก API ของบริหารทรัพย์สิน — อนุญาตเฉพาะเจ้าขององค์กร (ไม่ใช่ staff) */
export async function withAssetOwnerContext(): Promise<
  | { ok: true; ctx: AssetApiContext }
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
  const scope = await getAssetDataScope(ctx.billingUserId);
  return {
    ok: true,
    ctx: {
      ownerUserId: ctx.billingUserId,
      trialSessionId: scope.trialSessionId,
    },
  };
}

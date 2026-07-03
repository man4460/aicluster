import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getHotelResortDataScope } from "@/lib/trial/module-scopes";

export type HotelResortApiContext = {
  ownerUserId: string;
  trialSessionId: string;
};

export async function withHotelResortOwnerContext(): Promise<
  { ok: true; ctx: HotelResortApiContext } | { ok: false; res: NextResponse }
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
    return { ok: false, res: NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 }) };
  }
  const scope = await getHotelResortDataScope(ctx.billingUserId);
  return {
    ok: true,
    ctx: { ownerUserId: ctx.billingUserId, trialSessionId: scope.trialSessionId },
  };
}

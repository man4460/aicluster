import { NextResponse } from "next/server";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

export async function buildingPosOwnerFromAuth(sessionSub: string): Promise<
  { ok: true; ownerId: string; isStaff: boolean } | { ok: false; response: NextResponse }
> {
  const ctx = await getModuleBillingContext(sessionSub);
  if (!ctx) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true, ownerId: ctx.billingUserId, isStaff: ctx.isStaff };
}

import { NextResponse } from "next/server";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import type { UserAccessFields } from "@/lib/modules/access";

export async function proResumeOwnerFromAuth(sessionSub: string): Promise<
  | { ok: true; ownerId: string; isStaff: boolean; access: UserAccessFields }
  | { ok: false; response: NextResponse }
> {
  const ctx = await getModuleBillingContext(sessionSub);
  if (!ctx) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { ok: true, ownerId: ctx.billingUserId, isStaff: ctx.isStaff, access: ctx.access };
}

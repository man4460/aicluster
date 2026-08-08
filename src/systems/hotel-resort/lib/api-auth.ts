import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getHotelResortDataScope } from "@/lib/trial/module-scopes";
import { requireHotelResortStaff } from "@/lib/hotel-resort/staff-auth";

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

/**
 * เจ้าของ (session) หรือลิงก์พนักงาน (`ownerId`+`t`+`k` ใน query + unlock header)
 * — ใช้กับแดชบอร์ด / จอง / เช็คอินบนพอร์ทัลพนักงาน
 */
export async function withHotelResortOwnerOrStaffContext(
  req: Request,
): Promise<{ ok: true; ctx: HotelResortApiContext } | { ok: false; res: NextResponse }> {
  const url = new URL(req.url);
  const k = url.searchParams.get("k")?.trim() ?? "";
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (k && ownerId) {
    const staff = await requireHotelResortStaff(req);
    if ("error" in staff) return { ok: false, res: staff.error };
    return {
      ok: true,
      ctx: {
        ownerUserId: staff.ctx.ownerId,
        trialSessionId: staff.ctx.trialSessionId,
      },
    };
  }
  return withHotelResortOwnerContext();
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { requireDormitoryStaff } from "@/lib/dormitory/staff-auth";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

export type DormitoryApiContext = {
  ownerUserId: string;
  trialSessionId: string;
};

export async function withDormitoryOwnerContext(): Promise<
  { ok: true; ctx: DormitoryApiContext } | { ok: false; res: NextResponse }
> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const scope = await getDormitoryDataScope(auth.session.sub);
  return {
    ok: true,
    ctx: { ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
  };
}

/** เจ้าของ (session) หรือลิงก์พนักงาน (`ownerId`+`t`+`k` ใน query + unlock header) */
export async function withDormitoryOwnerOrStaffContext(
  req: Request,
): Promise<{ ok: true; ctx: DormitoryApiContext } | { ok: false; res: NextResponse }> {
  const url = new URL(req.url);
  const k = url.searchParams.get("k")?.trim() ?? "";
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (k && ownerId) {
    const staff = await requireDormitoryStaff(req);
    if ("error" in staff) return { ok: false, res: staff.error };
    return {
      ok: true,
      ctx: {
        ownerUserId: staff.ctx.ownerId,
        trialSessionId: staff.ctx.trialSessionId,
      },
    };
  }
  return withDormitoryOwnerContext();
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getSmartPoliceOwnerFromAuth } from "@/lib/smart-police/api-owner";

export type SmartPoliceApiCtx = { ownerUserId: string };

export async function withSmartPoliceOwner():
  Promise<{ ok: true; ctx: SmartPoliceApiCtx } | { ok: false; res: NextResponse }> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const owner = await getSmartPoliceOwnerFromAuth(auth.session.sub);
  if (!owner) {
    return { ok: false, res: NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 }) };
  }
  if (owner.isStaff) {
    return {
      ok: false,
      res: NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 }),
    };
  }
  return { ok: true, ctx: { ownerUserId: owner.ownerUserId } };
}

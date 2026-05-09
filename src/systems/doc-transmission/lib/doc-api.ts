import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getDocTransmissionDataScope } from "@/lib/trial/module-scopes";

export type DocApiContext = {
  ownerUserId: string;
  trialSessionId: string;
  /** ผู้ที่กดทำ (อาจเป็น staff ที่ทำในนามเจ้าขององค์กร — เก็บใน audit/timeline) */
  actorUserId: string;
  actorName: string | null;
};

export type WithDocOwnerContextResult =
  | { ok: true; ctx: DocApiContext }
  | { ok: false; res: NextResponse };

/** API helper — ใช้ทุก endpoint ของสารบรรณดิจิทัล (เจ้าของเท่านั้น) */
export async function withDocOwnerContext(): Promise<WithDocOwnerContextResult> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const billing = await getModuleBillingContext(auth.session.sub);
  if (!billing) {
    return { ok: false, res: NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 }) };
  }
  if (billing.isStaff) {
    return {
      ok: false,
      res: NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 }),
    };
  }
  const scope = await getDocTransmissionDataScope(billing.billingUserId);
  return {
    ok: true,
    ctx: {
      ownerUserId: billing.billingUserId,
      trialSessionId: scope.trialSessionId,
      actorUserId: auth.session.sub,
      actorName: auth.session.username ?? null,
    },
  };
}

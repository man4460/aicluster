import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { requireSession } from "@/lib/api-auth";
import { findDrinkPosMemberByPhoneQuery } from "@/systems/drink-pos/lib/member-service";

const schema = z.object({ phone: z.string().min(4).max(20) });

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

  const scope = await getDrinkPosDataScope(ctx.billingUserId);
  const result = await findDrinkPosMemberByPhoneQuery(
    prisma,
    ctx.billingUserId,
    scope.trialSessionId,
    parsed.data.phone,
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ member: result });
}

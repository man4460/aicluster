import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const modCtx = await getModuleBillingContext(auth.session.sub);
  if (!modCtx || modCtx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = (await ctx.params).id;
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 400 });

  const target = await prisma.user.findFirst({
    where: { id, employerUserId: modCtx.billingUserId },
  });
  if (!target) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.user.update({
    where: { id },
    data: { employerUserId: null },
  });

  return NextResponse.json({ ok: true });
}

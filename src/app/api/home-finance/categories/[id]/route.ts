import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.number().int().min(1).max(999).optional(),
  isActive: z.boolean().optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const existing = await prisma.homeFinanceCategory.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const row = await prisma.homeFinanceCategory.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    });
    return NextResponse.json({ category: row });
  } catch {
    return NextResponse.json({ error: "ชื่อหมวดซ้ำ" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const existing = await prisma.homeFinanceCategory.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  await prisma.homeFinanceCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  sortOrder: z.number().int().min(1).max(999).optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function requireOwner() {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const, billingUserId: ctx.billingUserId };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireOwner();
  if (!guard.ok) return guard.res;

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.homeFinanceAiPromptCategory.findFirst({
    where: { id, ownerUserId: guard.billingUserId },
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
    const row = await prisma.homeFinanceAiPromptCategory.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      },
    });
    if (parsed.data.name !== undefined && parsed.data.name !== existing.name) {
      await prisma.homeFinanceAiPrompt.updateMany({
        where: { ownerUserId: guard.billingUserId, categoryId: id },
        data: { promptType: parsed.data.name },
      });
    }
    return NextResponse.json({
      category: {
        id: row.id,
        name: row.name,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "ชื่อหมวดซ้ำ" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await requireOwner();
  if (!guard.ok) return guard.res;

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.homeFinanceAiPromptCategory.findFirst({
    where: { id, ownerUserId: guard.billingUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const linked = await prisma.homeFinanceAiPrompt.count({
    where: { ownerUserId: guard.billingUserId, categoryId: id },
  });
  if (linked > 0) {
    return NextResponse.json(
      { error: `ยังมี Prompt ${linked} รายการในหมวดนี้ — ย้ายหรือลบก่อน` },
      { status: 409 },
    );
  }

  await prisma.homeFinanceAiPromptCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

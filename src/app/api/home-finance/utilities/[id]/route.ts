import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  provider: z.string().trim().max(120).optional().nullable(),
  accountNumber: z.string().trim().max(80).optional().nullable(),
  meterNumber: z.string().trim().max(80).optional().nullable(),
  defaultDueDay: z.number().int().min(1).max(31).optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
  isActive: z.boolean().optional(),
});

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

  const existing = await prisma.homeUtilityProfile.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
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

  const row = await prisma.homeUtilityProfile.update({
    where: { id },
    data: {
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.provider !== undefined ? { provider: parsed.data.provider?.trim() || null } : {}),
      ...(parsed.data.accountNumber !== undefined
        ? { accountNumber: parsed.data.accountNumber?.trim() || null }
        : {}),
      ...(parsed.data.meterNumber !== undefined ? { meterNumber: parsed.data.meterNumber?.trim() || null } : {}),
      ...(parsed.data.defaultDueDay !== undefined ? { defaultDueDay: parsed.data.defaultDueDay } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate: parseDateOnly(parsed.data.dueDate) } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
  });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const existing = await prisma.homeUtilityProfile.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  await prisma.homeUtilityProfile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

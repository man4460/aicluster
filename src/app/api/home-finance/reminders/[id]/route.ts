import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { writeSystemActivityLog } from "@/lib/audit-log";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().trim().max(400).optional().nullable(),
  isDone: z.boolean().optional(),
});

function parseDateOnly(value?: string): Date | null {
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

  const existing = await prisma.homeFinanceReminder.findFirst({
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
  const dueDate = parseDateOnly(parsed.data.dueDate);
  if (parsed.data.dueDate && !dueDate) return NextResponse.json({ error: "วันครบกำหนดไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.homeFinanceReminder.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
      ...(parsed.data.isDone !== undefined ? { isDone: parsed.data.isDone } : {}),
    },
  });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "HomeFinanceReminder",
    payload: { id, ownerUserId: mod.billingUserId, changes: parsed.data },
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

  const existing = await prisma.homeFinanceReminder.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  await prisma.homeFinanceReminder.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "HomeFinanceReminder",
    payload: { id, ownerUserId: mod.billingUserId },
  });
  return NextResponse.json({ ok: true });
}

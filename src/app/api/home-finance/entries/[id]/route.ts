import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { writeSystemActivityLog } from "@/lib/audit-log";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  entryDate: z.string().min(10).max(10).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryKey: z.string().min(2).max(64).optional(),
  categoryLabel: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(160).optional(),
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  dueDate: z.string().min(10).max(10).optional().nullable(),
  billNumber: z.string().max(100).optional().nullable(),
  serviceCenter: z.string().max(160).optional().nullable(),
  paymentMethod: z.string().max(40).optional().nullable(),
  note: z.string().max(600).optional().nullable(),
});

function parseDateOnly(v: string | null | undefined): Date | null {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00+07:00`);
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const exists = await prisma.homeFinanceEntry.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const dueDate = parseDateOnly(parsed.data.dueDate ?? null);
  const entryDate = parseDateOnly(parsed.data.entryDate ?? null);
  if (parsed.data.dueDate && !dueDate) return NextResponse.json({ error: "วันครบกำหนดไม่ถูกต้อง" }, { status: 400 });
  if (parsed.data.entryDate && !entryDate) return NextResponse.json({ error: "วันที่รายการไม่ถูกต้อง" }, { status: 400 });

  await prisma.homeFinanceEntry.update({
    where: { id },
    data: {
      ...(parsed.data.entryDate !== undefined ? { entryDate } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.categoryKey !== undefined ? { categoryKey: parsed.data.categoryKey } : {}),
      ...(parsed.data.categoryLabel !== undefined
        ? { categoryLabel: parsed.data.categoryLabel.trim().slice(0, 100) }
        : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title.trim() } : {}),
      ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
      ...(parsed.data.dueDate !== undefined ? { dueDate } : {}),
      ...(parsed.data.billNumber !== undefined ? { billNumber: parsed.data.billNumber?.trim() || null } : {}),
      ...(parsed.data.serviceCenter !== undefined
        ? { serviceCenter: parsed.data.serviceCenter?.trim() || null }
        : {}),
      ...(parsed.data.paymentMethod !== undefined
        ? { paymentMethod: parsed.data.paymentMethod?.trim() || null }
        : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
    },
  });

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "HomeFinanceEntry",
    payload: { id, ownerUserId: mod.billingUserId, changes: parsed.data },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mod = await getModuleBillingContext(auth.session.sub);
  if (!mod || mod.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const exists = await prisma.homeFinanceEntry.findFirst({
    where: { id, ownerUserId: mod.billingUserId },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.homeFinanceEntry.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "HomeFinanceEntry",
    payload: { id, ownerUserId: mod.billingUserId },
  });
  return NextResponse.json({ ok: true });
}

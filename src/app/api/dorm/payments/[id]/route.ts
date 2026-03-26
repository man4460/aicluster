import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  amountToPay: z.number().finite().positive().max(99_999_999.99).optional(),
  note: z.string().max(500).optional().nullable(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  paidAt: z.string().min(10).max(40).optional().nullable(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePaidAt(v: string | null | undefined): Date | null {
  if (v == null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const existing = await prisma.splitBillPayment.findFirst({
    where: { id, tenant: { room: { ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const data: {
    amountToPay?: unknown;
    note?: string | null;
    paymentStatus?: "PENDING" | "PAID" | "OVERDUE";
    paidAt?: Date | null;
    receiptNumber?: string | null;
  } = {};

  if (parsed.data.amountToPay !== undefined) {
    data.amountToPay = parsed.data.amountToPay;
  }
  if (parsed.data.note !== undefined) data.note = parsed.data.note?.trim() || null;

  if (parsed.data.paymentStatus !== undefined) {
    data.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.paymentStatus === "PAID") {
      const pa = parsePaidAt(parsed.data.paidAt ?? undefined);
      data.paidAt = pa ?? new Date();
      if (!existing.receiptNumber) {
        data.receiptNumber = `RCP-${Date.now()}`;
      }
    } else {
      data.paidAt = null;
      data.receiptNumber = null;
    }
  } else if (parsed.data.paidAt !== undefined) {
    const pa = parsePaidAt(parsed.data.paidAt);
    data.paidAt = pa;
  }

  const updated = await prisma.splitBillPayment.update({
    where: { id },
    data,
  });

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "SplitBillPayment",
    payload: { id, changes: parsed.data },
  });

  return NextResponse.json({
    item: {
      id: updated.id,
      amountToPay: Number(updated.amountToPay),
      paymentStatus: updated.paymentStatus,
      paidAt: updated.paidAt?.toISOString() ?? null,
      receiptNumber: updated.receiptNumber,
      note: updated.note,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const existing = await prisma.splitBillPayment.findFirst({
    where: { id, tenant: { room: { ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId } } },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  await prisma.splitBillPayment.delete({ where: { id } });

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "SplitBillPayment",
    payload: { id },
  });

  return NextResponse.json({ ok: true });
}

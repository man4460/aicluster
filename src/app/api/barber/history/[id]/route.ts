import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { writeSystemActivityLog } from "@/lib/audit-log";

type Ctx = { params: Promise<{ id: string }> };

const barberCashReceiptUrl = z
  .string()
  .max(512)
  .regex(/^\/uploads\/barber-cash-receipts\/[a-zA-Z0-9._-]+$/);

const patchSchema = z.object({
  note: z.string().trim().max(255).optional().nullable(),
  amountBaht: z.number().finite().min(0).max(999_999.99).optional().nullable(),
  receiptImageUrl: z.union([barberCashReceiptUrl, z.null()]).optional(),
  createdAt: z.iso.datetime().optional(),
  customerPhone: z.string().optional(),
  customerName: z.string().trim().max(100).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
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

  const scope = await getBarberDataScope(own.ownerId);
  const log = await prisma.barberServiceLog.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    include: { customer: true },
  });
  if (!log) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const d = parsed.data;
  const isCash = log.visitType === "CASH_WALK_IN";

  if (d.createdAt !== undefined) {
    const t = new Date(d.createdAt).getTime();
    if (Number.isNaN(t)) {
      return NextResponse.json({ error: "เวลาไม่ถูกต้อง" }, { status: 400 });
    }
    const now = Date.now();
    if (t > now + 60 * 60 * 1000) {
      return NextResponse.json({ error: "เวลาไม่ควรอยู่ในอนาคต" }, { status: 400 });
    }
    if (t < Date.UTC(2020, 0, 1)) {
      return NextResponse.json({ error: "เวลาไม่ถูกต้อง" }, { status: 400 });
    }
  }

  const custData: { phone?: string; name?: string | null } = {};
  if (d.customerPhone !== undefined) {
    const p = normalizePhone(d.customerPhone);
    if (p.length < 9) {
      return NextResponse.json({ error: "เบอร์โทรอย่างน้อย 9 หลัก" }, { status: 400 });
    }
    custData.phone = p;
  }
  if (d.customerName !== undefined) {
    custData.name = d.customerName === null || d.customerName === "" ? null : d.customerName;
  }

  const logData: Prisma.BarberServiceLogUncheckedUpdateInput = {};
  if (d.note !== undefined) logData.note = d.note?.trim() || null;
  if (d.amountBaht !== undefined && isCash) logData.amountBaht = d.amountBaht;
  if (d.receiptImageUrl !== undefined && isCash) logData.receiptImageUrl = d.receiptImageUrl;
  if (d.createdAt !== undefined) logData.createdAt = new Date(d.createdAt);

  if (Object.keys(custData).length === 0 && Object.keys(logData).length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(custData).length > 0) {
        await tx.barberCustomer.update({
          where: { id: log.barberCustomerId },
          data: custData,
        });
      }
      if (Object.keys(logData).length > 0) {
        await tx.barberServiceLog.update({
          where: { id },
          data: logData,
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "เบอร์นี้มีลูกค้าอื่นในระบบแล้ว" }, { status: 400 });
    }
    throw e;
  }

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "BarberServiceLog",
    payload: { id, ownerUserId: own.ownerId, changes: parsed.data },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBarberDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const row = await prisma.barberServiceLog.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  await prisma.barberServiceLog.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "BarberServiceLog",
    payload: { id, ownerUserId: own.ownerId },
  });
  return NextResponse.json({ ok: true });
}

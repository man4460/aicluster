import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };
const patchSchema = z.object({
  remainingSessions: z.number().int().min(0).max(9999).optional(),
  status: z.enum(["ACTIVE", "EXHAUSTED", "CANCELLED"]).optional(),
  customerName: z.string().trim().max(100).optional().nullable(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId },
    include: {
      customer: true,
      package: true,
    },
  });
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  return NextResponse.json({
    subscription: {
      id: sub.id,
      remainingSessions: sub.remainingSessions,
      status: sub.status,
      packageName: sub.package.name,
      packageId: sub.packageId,
      customer: {
        id: sub.customer.id,
        phone: sub.customer.phone,
        name: sub.customer.name,
      },
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId },
    include: { customer: true },
  });
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  if (parsed.data.customerName !== undefined) {
    await prisma.barberCustomer.update({
      where: { id: sub.barberCustomerId },
      data: { name: parsed.data.customerName?.trim() || null },
    });
  }
  const next = await prisma.barberCustomerSubscription.update({
    where: { id },
    data: {
      ...(parsed.data.remainingSessions !== undefined ? { remainingSessions: parsed.data.remainingSessions } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    },
  });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "BarberCustomerSubscription",
    payload: { id, ownerUserId: own.ownerId, changes: parsed.data },
  });
  return NextResponse.json({ subscription: { id: next.id, remainingSessions: next.remainingSessions, status: next.status } });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  const sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId },
    select: { id: true },
  });
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });
  await prisma.barberCustomerSubscription.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "BarberCustomerSubscription",
    payload: { id, ownerUserId: own.ownerId },
  });
  return NextResponse.json({ ok: true });
}

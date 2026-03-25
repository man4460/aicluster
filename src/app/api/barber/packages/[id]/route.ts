import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";

const patchSchema = z.object({
  name: z.string().min(1).max(191).optional(),
  price: z.number().finite().min(0).max(99_999_999).optional(),
  totalSessions: z.number().int().min(1).max(9999).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

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
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.barberPackage.findFirst({
    where: { id, ownerUserId: own.ownerId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const d = parsed.data;
  if (d.totalSessions !== undefined) {
    const hasSubs = await prisma.barberCustomerSubscription.count({
      where: { packageId: id, ownerUserId: own.ownerId },
    });
    if (hasSubs > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถเปลี่ยนจำนวนครั้งได้ — มีสมาชิกแพ็กเกจนี้แล้ว" },
        { status: 400 },
      );
    }
  }

  const p = await prisma.barberPackage.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name.trim() }),
      ...(d.price !== undefined && { price: d.price }),
      ...(d.totalSessions !== undefined && { totalSessions: d.totalSessions }),
    },
  });

  return NextResponse.json({
    package: {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      totalSessions: p.totalSessions,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.barberPackage.findFirst({
    where: { id, ownerUserId: own.ownerId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  try {
    await prisma.barberPackage.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "ลบไม่ได้ — ยังมีสมาชิกแพ็กเกจอ้างอิงอยู่" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

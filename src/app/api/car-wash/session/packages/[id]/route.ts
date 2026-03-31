import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  price: z.number().int().min(0).max(9_999_999).optional(),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const p = await ctx.params;
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.carWashPackage.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const updated = await prisma.carWashPackage.update({
    where: { id: row.id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.price != null ? { price: parsed.data.price } : {}),
      ...(parsed.data.duration_minutes != null ? { durationMinutes: parsed.data.duration_minutes } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() ?? "" } : {}),
      ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
    },
  });
  return NextResponse.json({
    package: {
      id: updated.id,
      name: updated.name,
      price: updated.price,
      duration_minutes: updated.durationMinutes,
      description: updated.description,
      is_active: updated.isActive,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  const p = await ctx.params;
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.carWashPackage.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ ok: false });
  await prisma.carWashPackage.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}

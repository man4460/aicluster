import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(32).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

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

  const existing = await prisma.villageResident.findFirst({
    where: {
      id,
      house: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const row = await prisma.villageResident.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone?.trim() || null } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
      ...(parsed.data.is_primary !== undefined ? { isPrimary: parsed.data.is_primary } : {}),
      ...(parsed.data.is_active !== undefined ? { isActive: parsed.data.is_active } : {}),
    },
  });

  return NextResponse.json({
    resident: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      note: row.note,
      is_primary: row.isPrimary,
      is_active: row.isActive,
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.villageResident.findFirst({
    where: {
      id,
      house: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.villageResident.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { writeSystemActivityLog } from "@/lib/audit-log";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  note: z.string().trim().max(255).optional().nullable(),
  amountBaht: z.number().finite().min(0).max(999_999.99).optional().nullable(),
});

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

  const row = await prisma.barberServiceLog.findFirst({
    where: { id, ownerUserId: own.ownerId },
    select: { id: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.barberServiceLog.update({
    where: { id },
    data: {
      ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
      ...(parsed.data.amountBaht !== undefined ? { amountBaht: parsed.data.amountBaht } : {}),
    },
  });
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

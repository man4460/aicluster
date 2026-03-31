import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { mqttOwnerFromAuth } from "@/lib/mqtt/api-owner";
import { getMqttDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  label: z.string().max(160).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

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

  const row = await prisma.mqttCredential.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  const updated = await prisma.mqttCredential.update({
    where: { id: row.id },
    data: {
      ...(parsed.data.label !== undefined ? { label: parsed.data.label?.trim() ?? "" } : {}),
      ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
    },
  });
  return NextResponse.json({
    credential: {
      id: updated.id,
      label: updated.label,
      client_id: updated.clientId,
      username: updated.username,
      is_active: updated.isActive,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

  const p = await ctx.params;
  const id = Number(p.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.mqttCredential.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ ok: false });
  await prisma.mqttCredential.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}

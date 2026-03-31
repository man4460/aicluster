import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { mqttOwnerFromAuth } from "@/lib/mqtt/api-owner";
import { getMqttDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  subject_type: z.enum(["username", "clientId"]).optional(),
  subject_value: z.string().min(1).max(128).optional(),
  action: z.enum(["publish", "subscribe"]).optional(),
  topic_pattern: z.string().min(1).max(255).optional(),
  effect: z.enum(["allow", "deny"]).optional(),
  priority: z.number().int().min(1).max(1000).optional(),
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

  const row = await prisma.mqttAclRule.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  const updated = await prisma.mqttAclRule.update({
    where: { id: row.id },
    data: {
      ...(parsed.data.subject_type != null ? { subjectType: parsed.data.subject_type } : {}),
      ...(parsed.data.subject_value != null ? { subjectValue: parsed.data.subject_value.trim() } : {}),
      ...(parsed.data.action != null ? { action: parsed.data.action } : {}),
      ...(parsed.data.topic_pattern != null ? { topicPattern: parsed.data.topic_pattern.trim() } : {}),
      ...(parsed.data.effect != null ? { effect: parsed.data.effect } : {}),
      ...(parsed.data.priority != null ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
    },
  });
  return NextResponse.json({
    rule: {
      id: updated.id,
      subject_type: updated.subjectType,
      subject_value: updated.subjectValue,
      action: updated.action,
      topic_pattern: updated.topicPattern,
      effect: updated.effect,
      priority: updated.priority,
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

  const row = await prisma.mqttAclRule.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ ok: false });
  await prisma.mqttAclRule.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { mqttOwnerFromAuth } from "@/lib/mqtt/api-owner";
import { getMqttDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  subject_type: z.enum(["username", "clientId"]),
  subject_value: z.string().min(1).max(128),
  action: z.enum(["publish", "subscribe"]),
  topic_pattern: z.string().min(1).max(255),
  effect: z.enum(["allow", "deny"]).default("allow"),
  priority: z.number().int().min(1).max(1000).default(100),
  is_active: z.boolean().default(true),
});

function tenantCodeFor(ownerId: string, trialId: string) {
  const compact = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "dev";
  return `${compact(ownerId)}-${compact(trialId)}`;
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

  const rows = await prisma.mqttAclRule.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: [{ priority: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({
    rules: rows.map((r) => ({
      id: r.id,
      subject_type: r.subjectType,
      subject_value: r.subjectValue,
      action: r.action,
      topic_pattern: r.topicPattern,
      effect: r.effect,
      priority: r.priority,
      is_active: r.isActive,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.mqttAclRule.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      tenantCode: tenantCodeFor(own.ownerId, scope.trialSessionId),
      subjectType: parsed.data.subject_type,
      subjectValue: parsed.data.subject_value.trim(),
      action: parsed.data.action,
      topicPattern: parsed.data.topic_pattern.trim(),
      effect: parsed.data.effect,
      priority: parsed.data.priority,
      isActive: parsed.data.is_active,
    },
  });
  return NextResponse.json({
    rule: {
      id: row.id,
      subject_type: row.subjectType,
      subject_value: row.subjectValue,
      action: row.action,
      topic_pattern: row.topicPattern,
      effect: row.effect,
      priority: row.priority,
      is_active: row.isActive,
    },
  });
}

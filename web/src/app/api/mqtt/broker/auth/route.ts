import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyMqttWebhookSecret } from "@/lib/mqtt/webhook-secret";

const bodySchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(256),
  clientId: z.string().min(1).max(128).optional().nullable(),
  ip: z.string().max(64).optional().nullable(),
});

export async function POST(req: Request) {
  if (!verifyMqttWebhookSecret(req.headers)) {
    return NextResponse.json({ allow: false }, { status: 401 });
  }
  const ip = clientIp(req.headers);
  const rl = rateLimit(`mqtt-broker-auth:${ip}`, 300, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ allow: false }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ allow: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ allow: false }, { status: 400 });

  const row = await prisma.mqttCredential.findFirst({
    where: { username: parsed.data.username, isActive: true },
    orderBy: { id: "desc" },
  });
  if (!row) return NextResponse.json({ allow: false });
  if (parsed.data.clientId && row.clientId !== parsed.data.clientId) return NextResponse.json({ allow: false });
  const ok = await verifyPassword(parsed.data.password, row.passwordHash);
  if (!ok) return NextResponse.json({ allow: false });

  await prisma.$transaction([
    prisma.mqttCredential.update({
      where: { id: row.id },
      data: { lastSeenAt: new Date() },
    }),
    prisma.mqttClientSessionLog.create({
      data: {
        ownerUserId: row.ownerUserId,
        trialSessionId: row.trialSessionId,
        tenantCode: row.tenantCode,
        clientId: parsed.data.clientId?.trim() || row.clientId,
        username: row.username,
        eventType: "connect",
        ipAddress: parsed.data.ip?.trim() || ip,
      },
    }),
  ]);

  return NextResponse.json({
    allow: true,
    owner_id: row.ownerUserId,
    trial_session_id: row.trialSessionId,
    tenant_code: row.tenantCode,
  });
}

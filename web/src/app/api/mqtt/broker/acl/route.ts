import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyMqttWebhookSecret } from "@/lib/mqtt/webhook-secret";
import { mqttTopicMatchesFilter } from "@/lib/mqtt/topic";

const bodySchema = z.object({
  username: z.string().min(1).max(128).optional().nullable(),
  clientId: z.string().min(1).max(128).optional().nullable(),
  action: z.enum(["publish", "subscribe"]),
  topic: z.string().min(1).max(255),
});

export async function POST(req: Request) {
  if (!verifyMqttWebhookSecret(req.headers)) {
    return NextResponse.json({ allow: false }, { status: 401 });
  }
  const ip = clientIp(req.headers);
  const rl = rateLimit(`mqtt-broker-acl:${ip}`, 1000, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ allow: false }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ allow: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ allow: false }, { status: 400 });

  const username = parsed.data.username?.trim() || "";
  const clientId = parsed.data.clientId?.trim() || "";
  if (!username && !clientId) return NextResponse.json({ allow: false });

  const creds = await prisma.mqttCredential.findMany({
    where: {
      isActive: true,
      OR: [
        ...(username ? [{ username }] : []),
        ...(clientId ? [{ clientId }] : []),
      ],
    },
    select: { ownerUserId: true, trialSessionId: true },
    take: 5,
  });
  if (creds.length === 0) return NextResponse.json({ allow: false });

  const ownerTrialPairs = creds.map((c) => ({ ownerUserId: c.ownerUserId, trialSessionId: c.trialSessionId }));
  const rules = await prisma.mqttAclRule.findMany({
    where: {
      isActive: true,
      action: parsed.data.action,
      OR: ownerTrialPairs,
      AND: [
        {
          OR: [
            ...(username ? [{ subjectType: "username", subjectValue: username }] : []),
            ...(clientId ? [{ subjectType: "clientId", subjectValue: clientId }] : []),
          ],
        },
      ],
    },
    orderBy: [{ priority: "asc" }, { id: "asc" }],
  });

  for (const r of rules) {
    if (!mqttTopicMatchesFilter(r.topicPattern, parsed.data.topic)) continue;
    return NextResponse.json({ allow: r.effect === "allow" });
  }
  return NextResponse.json({ allow: false });
}

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { mqttOwnerFromAuth } from "@/lib/mqtt/api-owner";
import { hashPassword } from "@/lib/auth/password";
import { getMqttDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  label: z.string().max(160).optional().nullable(),
  clientId: z.string().min(3).max(128).optional().nullable(),
  username: z.string().min(3).max(128).optional().nullable(),
});

function compact(v: string) {
  return v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "dev";
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

  const rows = await prisma.mqttCredential.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      tenantCode: true,
      label: true,
      clientId: true,
      username: true,
      isActive: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({
    credentials: rows.map((r) => ({
      id: r.id,
      tenant_code: r.tenantCode,
      label: r.label,
      client_id: r.clientId,
      username: r.username,
      is_active: r.isActive,
      last_seen_at: r.lastSeenAt?.toISOString() ?? null,
      created_at: r.createdAt.toISOString(),
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

  const tenantCode = `${compact(own.ownerId)}-${compact(scope.trialSessionId)}`;
  await prisma.mqttTenantProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId } },
    create: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      tenantCode,
      displayName: "MQTT Tenant",
      isActive: true,
    },
    update: { tenantCode },
  });

  const seed = randomBytes(4).toString("hex");
  const clientId = parsed.data.clientId?.trim() || `c-${seed}`;
  const username = parsed.data.username?.trim() || `u-${seed}`;
  const password = randomBytes(16).toString("base64url");
  const passwordHash = await hashPassword(password);

  const row = await prisma.mqttCredential.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      tenantCode,
      label: parsed.data.label?.trim() || "",
      clientId,
      username,
      passwordHash,
      isActive: true,
    },
  });

  return NextResponse.json({
    credential: {
      id: row.id,
      tenant_code: row.tenantCode,
      label: row.label,
      client_id: row.clientId,
      username: row.username,
      is_active: row.isActive,
      created_at: row.createdAt.toISOString(),
    },
    password_plaintext: password,
  });
}

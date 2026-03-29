import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { mqttOwnerFromAuth } from "@/lib/mqtt/api-owner";
import { getMqttDataScope } from "@/lib/trial/module-scopes";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

  const [tenant, credentialCount, activeCredentialCount, latestSessionLogs] = await Promise.all([
    prisma.mqttTenantProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId } },
    }),
    prisma.mqttCredential.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    }),
    prisma.mqttCredential.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, isActive: true },
    }),
    prisma.mqttClientSessionLog.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    tenant: tenant
      ? {
          tenant_code: tenant.tenantCode,
          display_name: tenant.displayName,
          is_active: tenant.isActive,
        }
      : null,
    counts: {
      credentials: credentialCount,
      active_credentials: activeCredentialCount,
      online_clients_estimate: latestSessionLogs.filter((x) => x.eventType === "connect").length,
    },
    recent_sessions: latestSessionLogs.map((x) => ({
      id: Number(x.id),
      client_id: x.clientId,
      username: x.username,
      event_type: x.eventType,
      ip_address: x.ipAddress,
      created_at: x.createdAt.toISOString(),
    })),
  });
}

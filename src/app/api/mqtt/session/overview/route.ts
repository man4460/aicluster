import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { mqttOwnerFromAuth } from "@/lib/mqtt/api-owner";
import { getMqttDataScope } from "@/lib/trial/module-scopes";
import { getMqttPublicBrokerDisplay } from "@/lib/mqtt/broker-public-config";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import { mqttSessionApiDisabled } from "@/lib/mqtt/session-api-guard";

/** ถ้าเชื่อมต่อและอัปเดต lastSeen ภายในช่วงนี้ ถือว่า "น่าจะออนไลน์" */
const LIKELY_ONLINE_MS = 15 * 60 * 1000;

export async function GET() {
  const disabled = mqttSessionApiDisabled();
  if (disabled) return disabled;
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await mqttOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMqttDataScope(own.ownerId);

  const sinceOnline = new Date(Date.now() - LIKELY_ONLINE_MS);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    tenant,
    credentialCount,
    activeCredentialCount,
    likelyOnlineNow,
    connectEvents24h,
    uniqueClients24hRows,
    latestSessionLogs,
    appBaseUrl,
  ] = await Promise.all([
    prisma.mqttTenantProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId } },
    }),
    prisma.mqttCredential.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    }),
    prisma.mqttCredential.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, isActive: true },
    }),
    prisma.mqttCredential.count({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        isActive: true,
        lastSeenAt: { gte: sinceOnline },
      },
    }),
    prisma.mqttClientSessionLog.count({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        eventType: "connect",
        createdAt: { gte: since24h },
      },
    }),
    prisma.mqttClientSessionLog.groupBy({
      by: ["clientId"],
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        eventType: "connect",
        createdAt: { gte: since24h },
      },
    }),
    prisma.mqttClientSessionLog.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    getServerAppBaseUrl(),
  ]);

  const broker = getMqttPublicBrokerDisplay();
  const base = appBaseUrl.replace(/\/$/, "");
  const tcpUrl =
    broker.tcpHost.length > 0 ? `${broker.tcpScheme}://${broker.tcpHost}:${broker.tcpPort}` : "";

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
      /** credential ที่ lastSeen ภายใน ~15 นาที */
      likely_online_now: likelyOnlineNow,
      /** จำนวน clientId ไม่ซ้ำที่มี event connect ใน 24 ชม. */
      unique_devices_24h: uniqueClients24hRows.length,
      /** จำนวนครั้งที่ broker เรียก webhook connect ใน 24 ชม. */
      connect_events_24h: connectEvents24h,
    },
    broker: {
      tcp_url: tcpUrl,
      tcp_host: broker.tcpHost,
      tcp_port: broker.tcpPort,
      tcp_scheme: broker.tcpScheme,
      websocket_url: broker.websocketUrl,
      secure_websocket_url: broker.secureWebsocketUrl,
      notes: broker.notes,
    },
    webhooks: {
      auth_url: base ? `${base}/api/mqtt/broker/auth` : "",
      acl_url: base ? `${base}/api/mqtt/broker/acl` : "",
    },
    security: {
      webhook_secret_configured: Boolean(process.env.MQTT_WEBHOOK_SECRET?.trim()),
      likely_online_window_minutes: Math.round(LIKELY_ONLINE_MS / 60000),
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

/**
 * ค่าที่แสดงใน UI การเชื่อมต่อ MQTT — อ่านจาก env (ส่วนใหญ่ NEXT_PUBLIC_*)
 * ไม่มีรหัสผ่าน / webhook secret
 */

export type MqttPublicBrokerDisplay = {
  tcpHost: string;
  tcpPort: number;
  tcpScheme: "mqtt" | "mqtts";
  /** ws:// หรือ wss:// เต็มสตริง สำหรับเบราว์เซอร์ / WebSocket client */
  websocketUrl: string | null;
  /** ถ้ามี TLS แยกจาก TCP */
  secureWebsocketUrl: string | null;
  /** คำอธิบายสั้น ๆ ถ้าไม่มี ws */
  notes: string[];
};

function parseMqttBrokerUrl(raw: string | undefined): { host: string; port: number; secure: boolean } | null {
  const u = raw?.trim();
  if (!u) return null;
  try {
    const normalized = u.replace(/^mqtt\+tcp:\/\//i, "mqtt://");
    const parsed = new URL(normalized);
    const secure = parsed.protocol === "mqtts:" || parsed.protocol === "ssl:";
    const port = parsed.port ? Number(parsed.port) : secure ? 8883 : 1883;
    if (!parsed.hostname) return null;
    return { host: parsed.hostname, port, secure };
  } catch {
    return null;
  }
}

/** แปลง http(s):// เป็น ws(s):// สำหรับพอร์ตเว็บ/พร็อกซี MQTT over WebSocket */
export function normalizeHttpToWebSocketUrl(url: string): string {
  const t = url.trim();
  if (t.startsWith("https://")) return `wss://${t.slice(8)}`;
  if (t.startsWith("http://")) return `ws://${t.slice(7)}`;
  if (t.startsWith("wss://") || t.startsWith("ws://")) return t;
  return t;
}

export function getMqttPublicBrokerDisplay(): MqttPublicBrokerDisplay {
  const fromEnv = parseMqttBrokerUrl(process.env.MQTT_BROKER_URL);
  const host =
    process.env.NEXT_PUBLIC_MQTT_BROKER_HOST?.trim() ||
    process.env.MQTT_PUBLIC_HOST?.trim() ||
    fromEnv?.host ||
    "";
  const tcpPort = (() => {
    const p = process.env.NEXT_PUBLIC_MQTT_BROKER_PORT_TCP?.trim();
    if (p && Number.isFinite(Number(p))) return Number(p);
    return fromEnv?.port ?? 1883;
  })();
  const tcpScheme: "mqtt" | "mqtts" = fromEnv?.secure === true ? "mqtts" : "mqtt";

  const notes: string[] = [];
  const wsRaw =
    process.env.NEXT_PUBLIC_MQTT_WS_URL?.trim() ||
    process.env.NEXT_PUBLIC_MQTT_WEBSOCKET_URL?.trim() ||
    process.env.MQTT_PUBLIC_WS_URL?.trim() ||
    "";
  let websocketUrl: string | null = null;
  if (wsRaw) {
    websocketUrl = normalizeHttpToWebSocketUrl(wsRaw);
  } else {
    notes.push(
      "ยังไม่ได้ตั้ง NEXT_PUBLIC_MQTT_WS_URL — ตั้งเป็น ws://โฮสต์:พอร์ต (เช่น ws://mawell.thddns.net:4745) ถ้า broker รองรับ WebSocket",
    );
  }

  const wssRaw = process.env.NEXT_PUBLIC_MQTT_WSS_URL?.trim() || "";
  const secureWebsocketUrl = wssRaw ? normalizeHttpToWebSocketUrl(wssRaw) : null;

  if (!host) {
    notes.push("ตั้ง MQTT_BROKER_URL หรือ NEXT_PUBLIC_MQTT_BROKER_HOST ให้ตรงกับ broker จริง");
  }

  return {
    tcpHost: host,
    tcpPort,
    tcpScheme,
    websocketUrl,
    secureWebsocketUrl,
    notes,
  };
}

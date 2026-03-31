import mqtt, { type MqttClient } from "mqtt";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { fulfillMelodyOrder } from "@/lib/payments/fulfill-melody-order";

const TOPIC_QRGEN = "qrgen";
const QRGEN_TIMEOUT_MS = 60_000;
const SINGLETON_KEY = "__MELODY_MQTT_BRIDGE_V1__";

type BranchResponse = {
  cm?: string;
  id?: string;
  value_str1?: string;
  value_str2?: string;
  mch_order_no?: string;
  [key: string]: unknown;
};

type PendingQrGen = {
  resolve: (qrText: string) => void;
  reject: (err: Error) => void;
  timeout: NodeJS.Timeout;
};
type EventLog = { at: string; topic: string; raw: string };

function toBranchTopic(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "V0";
  return v.toUpperCase().startsWith("V") ? v.toUpperCase() : `V${v}`;
}

function topupAttachPayloadValue(topic: string): string {
  return topic.replace(/^V/i, "");
}

function nowOrderPrefix() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

function parseOrderIdFromDeviceId(deviceId: string): string | null {
  // Legacy format: web-<topUpOrderId>-<userId>
  const m = /^web-([A-Za-z0-9]+)-/.exec(deviceId);
  return m?.[1] ?? null;
}

function shortRef(value: string, len = 8): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, len);
}

function buildCompactDeviceId(orderId: string, userId: string): string {
  return `web${shortRef(orderId, 8)}u${shortRef(userId, 6)}`;
}

function buildCompactOrderNo(orderId: string): string {
  return `${nowOrderPrefix()}${shortRef(orderId, 8)}`;
}

class MelodyMqttBridge {
  private readonly brokerUrl: string | null;
  private readonly attachTopic: string;
  private readonly branchTopics: string[];
  private client: MqttClient | null = null;
  private readonly pendingByTopic = new Map<string, PendingQrGen>();
  private readonly events: EventLog[] = [];

  constructor() {
    this.brokerUrl = process.env.MQTT_BROKER_URL?.trim() ?? null;
    this.attachTopic = toBranchTopic(process.env.MQTT_TOPUP_ATTACH);
    const envTopics = (process.env.MQTT_BRANCH_TOPICS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(toBranchTopic);
    this.branchTopics = envTopics.length > 0 ? Array.from(new Set(envTopics)) : [this.attachTopic];
  }

  get enabled() {
    return Boolean(this.brokerUrl);
  }

  ensureStarted() {
    if (!this.enabled) return;
    this.getClient();
  }

  getHealth() {
    return {
      enabled: this.enabled,
      brokerUrl: this.brokerUrl,
      attachTopic: this.attachTopic,
      branchTopics: this.branchTopics,
      connected: Boolean(this.client?.connected),
      pendingByTopic: Array.from(this.pendingByTopic.keys()),
      recentEvents: this.events.slice(-10),
    };
  }

  private pushEvent(topic: string, raw: string) {
    this.events.push({ at: new Date().toISOString(), topic, raw });
    while (this.events.length > 100) this.events.shift();
  }

  private getClient(): MqttClient {
    if (!this.enabled || !this.brokerUrl) {
      throw new Error("MQTT_BROKER_URL is not configured");
    }
    if (!this.client || !this.client.connected) {
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: `mawell-web-${Date.now()}`,
        reconnectPeriod: 5000,
      });
      this.client.on("connect", () => {
        this.branchTopics.forEach((topic) => {
          this.client?.subscribe(topic, { qos: 1 }, (err) => {
            if (err) console.error("[melody-mqtt] subscribe failed", topic, err);
          });
        });
      });
      this.client.on("message", (topic, payload) => this.handleTopicMessage(topic, payload.toString()));
    }
    return this.client;
  }

  private handleTopicMessage(topic: string, raw: string) {
    this.pushEvent(topic, raw);
    let data: BranchResponse;
    try {
      data = JSON.parse(raw) as BranchResponse;
    } catch {
      return;
    }

    if (data.cm === "qrgen") {
      const pending = this.pendingByTopic.get(topic);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.pendingByTopic.delete(topic);
      if (data.value_str1 !== "SUCCESS") {
        pending.reject(new Error(data.value_str1 || "QR generation failed"));
        return;
      }
      const qrText = data.value_str2?.trim();
      if (!qrText) {
        pending.reject(new Error("No QR payload returned from MQTT"));
        return;
      }
      pending.resolve(qrText);
      return;
    }

    if (
      data.cm === "qrsuccess" &&
      String(data.value_str1 ?? "").trim().toUpperCase() === "SUCCESS" &&
      typeof data.id === "string"
    ) {
      void (async () => {
        const orderId = await this.resolveOrderIdFromDeviceId(data.id as string);
        if (!orderId) return;
        await this.completeOrderFromQrsuccess(orderId, data);
      })();
    }
  }

  private async completeOrderFromQrsuccess(orderId: string, payload: BranchResponse) {
    try {
      const order = await prisma.topUpOrder.findUnique({ where: { id: orderId } });
      if (!order || order.status !== "PENDING") return;
      const prevMeta = (order.melodyMeta ?? {}) as Record<string, unknown>;
      await prisma.topUpOrder.update({
        where: { id: orderId },
        data: {
          externalRef:
            typeof payload.mch_order_no === "string"
              ? payload.mch_order_no
              : typeof payload.id === "string"
                ? payload.id
                : null,
          melodyMeta: {
            ...prevMeta,
            mqttLastEvent: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
            mqttLastEventAt: new Date().toISOString(),
          },
        },
      });
      await fulfillMelodyOrder(orderId);
    } catch (e) {
      console.error("[melody-mqtt] complete qrsuccess failed", e);
    }
  }

  private async resolveOrderIdFromDeviceId(deviceId: string): Promise<string | null> {
    const direct = parseOrderIdFromDeviceId(deviceId);
    if (direct) return direct;
    if (!deviceId.startsWith("web")) return null;
    const pending = await prisma.topUpOrder.findMany({
      where: { status: "PENDING" },
      select: { id: true, userId: true, melodyMeta: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const hit = pending.find((o) => {
      const meta = o.melodyMeta as { mqttDeviceId?: string } | null;
      if (meta?.mqttDeviceId === deviceId) return true;
      return buildCompactDeviceId(o.id, o.userId) === deviceId;
    });
    return hit?.id ?? null;
  }

  private async ensureConnected() {
    const client = this.getClient();
    if (client.connected) return client;
    return await new Promise<MqttClient>((resolve, reject) => {
      const onConnect = () => {
        client.off("error", onError);
        resolve(client);
      };
      const onError = (e: Error) => {
        client.off("connect", onConnect);
        reject(e);
      };
      client.once("connect", onConnect);
      client.once("error", onError);
    });
  }

  async createTopupQr(input: {
    orderId: string;
    userId: string;
    amountBaht: number;
  }): Promise<string> {
    const client = await this.ensureConnected();
    const topic = this.attachTopic;
    const existing = this.pendingByTopic.get(topic);
    if (existing) {
      clearTimeout(existing.timeout);
      existing.reject(new Error("Another top-up QR request is pending for this branch"));
    }

    const request = {
      mch_order_no: buildCompactOrderNo(input.orderId),
      device_id: buildCompactDeviceId(input.orderId, input.userId),
      total_fee: String(Math.round(input.amountBaht * 100)),
      attach: topupAttachPayloadValue(topic),
      product: "app",
    };
    const payload = JSON.stringify(request);
    client.publish(TOPIC_QRGEN, payload, { qos: 1 });

    return await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingByTopic.get(topic) === pending) {
          this.pendingByTopic.delete(topic);
          reject(new Error("QR generation timeout"));
        }
      }, QRGEN_TIMEOUT_MS);
      const pending: PendingQrGen = { resolve, reject, timeout };
      this.pendingByTopic.set(topic, pending);
    });
  }
}

export function melodyMqttCompactRefs(orderId: string, userId: string) {
  return {
    mchOrderNo: buildCompactOrderNo(orderId),
    deviceId: buildCompactDeviceId(orderId, userId),
  };
}

export function getMelodyMqttBridge(): MelodyMqttBridge {
  const g = globalThis as typeof globalThis & { [SINGLETON_KEY]?: MelodyMqttBridge };
  g[SINGLETON_KEY] ??= new MelodyMqttBridge();
  return g[SINGLETON_KEY];
}


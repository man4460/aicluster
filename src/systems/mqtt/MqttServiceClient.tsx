"use client";

import { useCallback, useEffect, useState } from "react";

type Credential = {
  id: number;
  tenant_code?: string;
  label: string;
  client_id: string;
  username: string;
  is_active: boolean;
  last_seen_at: string | null;
};

type AclRule = {
  id: number;
  subject_type: "username" | "clientId";
  subject_value: string;
  action: "publish" | "subscribe";
  topic_pattern: string;
  effect: "allow" | "deny";
  priority: number;
  is_active: boolean;
};

type OverviewPayload = {
  tenant: { tenant_code: string; display_name: string; is_active: boolean } | null;
  counts: {
    credentials: number;
    active_credentials: number;
    likely_online_now: number;
    unique_devices_24h: number;
    connect_events_24h: number;
  };
  broker: {
    tcp_url: string;
    tcp_host: string;
    tcp_port: number;
    tcp_scheme: string;
    websocket_url: string | null;
    secure_websocket_url: string | null;
    notes: string[];
  };
  webhooks: { auth_url: string; acl_url: string };
  security: { webhook_secret_configured: boolean; likely_online_window_minutes: number };
  recent_sessions: Array<{
    id: number;
    client_id: string;
    username: string | null;
    event_type: string;
    ip_address: string | null;
    created_at: string;
  }>;
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        });
      }}
    >
      {done ? "คัดลอกแล้ว" : label}
    </button>
  );
}

export function MqttServiceClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [rules, setRules] = useState<AclRule[]>([]);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [credLabel, setCredLabel] = useState("");
  const [ruleForm, setRuleForm] = useState({
    subject_type: "username" as "username" | "clientId",
    subject_value: "",
    action: "publish" as "publish" | "subscribe",
    topic_pattern: "devices/+/telemetry",
    effect: "allow" as "allow" | "deny",
    priority: "100",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [credRes, aclRes, ovRes] = await Promise.all([
        fetch("/api/mqtt/session/credentials", { cache: "no-store" }),
        fetch("/api/mqtt/session/acl", { cache: "no-store" }),
        fetch("/api/mqtt/session/overview", { cache: "no-store" }),
      ]);
      const credData = (await credRes.json().catch(() => ({}))) as { error?: string; credentials?: Credential[] };
      const aclData = (await aclRes.json().catch(() => ({}))) as { error?: string; rules?: AclRule[] };
      const ovData = (await ovRes.json().catch(() => ({}))) as Partial<OverviewPayload> & { error?: string };
      if (!credRes.ok) throw new Error(credData.error || "โหลด credentials ไม่สำเร็จ");
      if (!aclRes.ok) throw new Error(aclData.error || "โหลด ACL ไม่สำเร็จ");
      if (!ovRes.ok) throw new Error(ovData.error || "โหลดสรุป MQTT ไม่สำเร็จ");
      setCredentials(credData.credentials ?? []);
      setRules(aclData.rules ?? []);
      setOverview(ovData as OverviewPayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function createCredential() {
    setErr(null);
    setGeneratedPassword(null);
    const res = await fetch("/api/mqtt/session/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: credLabel.trim() || null }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; password_plaintext?: string };
    if (!res.ok) {
      setErr(data.error || "สร้าง credential ไม่สำเร็จ");
      return;
    }
    setCredLabel("");
    setGeneratedPassword(data.password_plaintext ?? null);
    await loadAll();
  }

  async function toggleCredential(id: number, isActive: boolean) {
    const res = await fetch(`/api/mqtt/session/credentials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error || "อัปเดตสถานะ credential ไม่สำเร็จ");
      return;
    }
    await loadAll();
  }

  async function createRule() {
    setErr(null);
    const priority = Number(ruleForm.priority);
    const res = await fetch("/api/mqtt/session/acl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_type: ruleForm.subject_type,
        subject_value: ruleForm.subject_value.trim(),
        action: ruleForm.action,
        topic_pattern: ruleForm.topic_pattern.trim(),
        effect: ruleForm.effect,
        priority: Number.isFinite(priority) ? priority : 100,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error || "สร้าง ACL ไม่สำเร็จ");
      return;
    }
    setRuleForm((s) => ({ ...s, subject_value: "", topic_pattern: "devices/+/telemetry", priority: "100" }));
    await loadAll();
  }

  async function deleteRule(id: number) {
    const res = await fetch(`/api/mqtt/session/acl/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(data.error || "ลบ ACL ไม่สำเร็จ");
      return;
    }
    await loadAll();
  }

  const sampleUser = credentials[0]?.username ?? "YOUR_USERNAME";
  const sampleClient = credentials[0]?.client_id ?? "YOUR_CLIENT_ID";
  const tenantHint = overview?.tenant?.tenant_code ?? credentials[0]?.tenant_code ?? "YOUR_TENANT";
  const wsForExample = overview?.broker.websocket_url ?? "ws://โฮสต์:พอร์ต";
  const tcpForExample = overview?.broker.tcp_url || "mqtt://โฮสต์:4745";

  const nodeExample = `import mqtt from "mqtt";

const url = "${wsForExample}"; // หรือ "${tcpForExample}"
const client = mqtt.connect(url, {
  clientId: "${sampleClient}",
  username: "${sampleUser}",
  password: "YOUR_PASSWORD",
  protocolVersion: 4,
});

client.on("connect", () => {
  console.log("connected");
  client.subscribe("${tenantHint}/+/status", (e) => {
    if (!e) console.log("subscribed");
  });
});

client.on("message", (topic, payload) => {
  console.log(topic, payload.toString());
});`;

  return (
    <div className="space-y-6">
      {loading ? <p className="text-sm text-slate-600">กำลังโหลด...</p> : null}
      {err ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      {generatedPassword ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          รหัสผ่านที่สร้างใหม่: <code className="rounded bg-white px-1">{generatedPassword}</code> (แสดงครั้งเดียว)
        </p>
      ) : null}

      {overview ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="app-surface rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">น่าจะออนไลน์ตอนนี้</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{overview.counts.likely_online_now}</p>
              <p className="mt-1 text-[11px] text-emerald-800/90">
                credential ที่มีการยืนยันตัวตนภายใน ~{overview.security.likely_online_window_minutes} นาทีล่าสุด
              </p>
            </div>
            <div className="app-surface rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">เครื่องไม่ซ้ำ (24 ชม.)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-900">{overview.counts.unique_devices_24h}</p>
              <p className="mt-1 text-[11px] text-sky-800/90">นับจาก clientId ที่มี event เชื่อมต่อ</p>
            </div>
            <div className="app-surface rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">ครั้งเชื่อมต่อ (24 ชม.)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-violet-900">{overview.counts.connect_events_24h}</p>
              <p className="mt-1 text-[11px] text-violet-800/90">จำนวนครั้งที่ broker ยืนยันสำเร็จ</p>
            </div>
            <div className="app-surface rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Credentials ที่เปิดใช้</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{overview.counts.active_credentials}</p>
              <p className="mt-1 text-[11px] text-slate-600">ทั้งหมด {overview.counts.credentials} รายการ</p>
            </div>
          </section>

          <section className="app-surface rounded-2xl border border-[#0000BF]/20 p-4">
            <h3 className="text-sm font-semibold text-slate-900">วิธีเชื่อมต่อ Broker</h3>
            <p className="mt-1 text-xs text-slate-600">
              ใช้ username / password / clientId จากตารางด้านล่าง — แต่ละอุปกรณ์ควรมี credential ของตัวเอง
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">MQTT (TCP)</span>
                  {overview.broker.tcp_url ? <CopyBtn text={overview.broker.tcp_url} label="คัดลอก URL" /> : null}
                </div>
                <code className="mt-2 block break-all rounded-lg bg-slate-50 px-2 py-2 font-mono text-xs text-slate-800">
                  {overview.broker.tcp_url || "ตั้ง MQTT_BROKER_URL หรือ NEXT_PUBLIC_MQTT_BROKER_HOST"}
                </code>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">MQTT over WebSocket</span>
                  {overview.broker.websocket_url ? <CopyBtn text={overview.broker.websocket_url} label="คัดลอก WS URL" /> : null}
                </div>
                <code className="mt-2 block break-all rounded-lg bg-slate-50 px-2 py-2 font-mono text-xs text-slate-800">
                  {overview.broker.websocket_url ?? "ตั้ง NEXT_PUBLIC_MQTT_WS_URL (เช่น ws://mawell.thddns.net:4745)"}
                </code>
                {overview.broker.secure_websocket_url ? (
                  <div className="mt-2">
                    <span className="text-xs text-slate-600">TLS (แนะนำเมื่อมีใบรับรอง): </span>
                    <code className="break-all font-mono text-xs">{overview.broker.secure_websocket_url}</code>
                    <CopyBtn text={overview.broker.secure_websocket_url} label="คัดลอก" />
                  </div>
                ) : null}
              </div>
              {overview.broker.notes.map((n) => (
                <p key={n} className="text-xs text-amber-800">
                  {n}
                </p>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">ตัวอย่าง Node.js (mqtt package)</span>
                <CopyBtn text={nodeExample} label="คัดลอกโค้ด" />
              </div>
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{nodeExample}</pre>
              <p className="mt-2 text-[11px] text-slate-600">
                แทนที่รหัสผ่านด้วยค่าจริงหลังสร้าง credential — หัวข้อ tenant แนะนำใช้รูปแบบ{" "}
                <code className="rounded bg-white px-1">{tenantHint}/...</code>
              </p>
            </div>
          </section>

          <section className="app-surface rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">การเข้ารหัสและกันคนอื่นใช้ Broker</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-slate-700">
              <li>
                รหัสผ่านของแต่ละ credential เก็บแบบ <strong>bcrypt</strong> ในฐานข้อมูล — broker ส่งมาที่แอปเพื่อตรวจสอบผ่าน{" "}
                <code className="rounded bg-slate-100 px-1">/api/mqtt/broker/auth</code> เท่านั้น
              </li>
              <li>
                ทุก publish/subscribe ตรวจสอทุกครั้งผ่าน{" "}
                <code className="rounded bg-slate-100 px-1">/api/mqtt/broker/acl</code> — ต้องมีกฎ ACL ที่อนุญาตเท่านั้น
                จึงจะทำได้
              </li>
              <li>
                ตั้งค่า <code className="rounded bg-slate-100 px-1">MQTT_WEBHOOK_SECRET</code> แล้วให้ broker ส่ง header{" "}
                <code className="rounded bg-slate-100 px-1">x-mqtt-secret</code> ตรงกับค่านี้ — ป้องกันการเรียก webhook ปลอม
                {overview.security.webhook_secret_configured ? (
                  <span className="ml-1 font-semibold text-emerald-700">(เปิดใช้แล้ว)</span>
                ) : (
                  <span className="ml-1 font-semibold text-amber-700">(ยังไม่ตั้ง — ระวังใน production)</span>
                )}
              </li>
              <li>
                แนะนำใช้ <strong>mqtts://</strong> และ <strong>wss://</strong> (TLS) บนอินเทอร์เน็ตสาธารณะ เพื่อเข้ารหัสทาง transport
              </li>
            </ul>
            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
              <p className="font-medium text-slate-800"> URL สำหรับตั้งค่า Broker (HTTP POST, JSON)</p>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <code className="break-all font-mono text-[11px] text-slate-700">{overview.webhooks.auth_url || "(ไม่มี base URL)"}</code>
                {overview.webhooks.auth_url ? <CopyBtn text={overview.webhooks.auth_url} label="คัดลอก" /> : null}
              </div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <code className="break-all font-mono text-[11px] text-slate-700">{overview.webhooks.acl_url || "(ไม่มี base URL)"}</code>
                {overview.webhooks.acl_url ? <CopyBtn text={overview.webhooks.acl_url} label="คัดลอก" /> : null}
              </div>
              <p className="text-[11px] text-slate-500">
                Base URL มาจากคำขอปัจจุบัน / APP_URL / NEXT_PUBLIC_APP_URL — ตั้งให้ตรง URL ที่ broker เข้าถึงได้
              </p>
            </div>
          </section>

          {overview.recent_sessions.length > 0 ? (
            <section className="app-surface rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-900">เหตุการณ์ล่าสุด</h3>
              <p className="mt-1 text-xs text-slate-600">เชื่อมต่อล่าสุดจาก webhook (สูงสุด 30 รายการ)</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[640px] w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 text-left">เวลา</th>
                      <th className="px-2 py-2 text-left">Client ID</th>
                      <th className="px-2 py-2 text-left">User</th>
                      <th className="px-2 py-2 text-left">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_sessions.slice(0, 15).map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600">
                          {new Date(s.created_at).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </td>
                        <td className="px-2 py-2 font-mono">{s.client_id}</td>
                        <td className="px-2 py-2 font-mono">{s.username ?? "—"}</td>
                        <td className="px-2 py-2 text-slate-600">{s.ip_address ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <section className="app-surface rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-900">Credentials</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
            placeholder="label (เช่น sensor-line-1)"
            value={credLabel}
            onChange={(e) => setCredLabel(e.target.value)}
          />
          <button type="button" onClick={() => void createCredential()} className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
            เพิ่ม credential
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Label</th>
                <th className="px-3 py-2 text-left">Client ID</th>
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">Last seen</th>
                <th className="px-3 py-2 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{c.label || "-"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.client_id}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.username}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {c.last_seen_at
                      ? new Date(c.last_seen_at).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          dateStyle: "short",
                          timeStyle: "medium",
                        })
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void toggleCredential(c.id, c.is_active)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}
                    >
                      {c.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="app-surface rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-900">ACL Rules</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
            value={ruleForm.subject_type}
            onChange={(e) => setRuleForm((s) => ({ ...s, subject_type: e.target.value as "username" | "clientId" }))}
          >
            <option value="username">subject: username</option>
            <option value="clientId">subject: clientId</option>
          </select>
          <input
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
            placeholder="subject value"
            value={ruleForm.subject_value}
            onChange={(e) => setRuleForm((s) => ({ ...s, subject_value: e.target.value }))}
          />
          <select
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
            value={ruleForm.action}
            onChange={(e) => setRuleForm((s) => ({ ...s, action: e.target.value as "publish" | "subscribe" }))}
          >
            <option value="publish">publish</option>
            <option value="subscribe">subscribe</option>
          </select>
          <select
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
            value={ruleForm.effect}
            onChange={(e) => setRuleForm((s) => ({ ...s, effect: e.target.value as "allow" | "deny" }))}
          >
            <option value="allow">allow</option>
            <option value="deny">deny</option>
          </select>
          <input
            className="app-input w-full rounded-xl px-3 py-2 text-sm sm:col-span-2"
            placeholder="topic pattern (เช่น devices/+/telemetry)"
            value={ruleForm.topic_pattern}
            onChange={(e) => setRuleForm((s) => ({ ...s, topic_pattern: e.target.value }))}
          />
          <input
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
            placeholder="priority"
            type="number"
            value={ruleForm.priority}
            onChange={(e) => setRuleForm((s) => ({ ...s, priority: e.target.value }))}
          />
          <button type="button" onClick={() => void createRule()} className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
            เพิ่ม ACL
          </button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Pattern</th>
                <th className="px-3 py-2 text-left">Effect</th>
                <th className="px-3 py-2 text-left">Priority</th>
                <th className="px-3 py-2 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    {r.subject_type}:{r.subject_value}
                  </td>
                  <td className="px-3 py-2">{r.action}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.topic_pattern}</td>
                  <td className="px-3 py-2">{r.effect}</td>
                  <td className="px-3 py-2">{r.priority}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => void deleteRule(r.id)} className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type Credential = {
  id: number;
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

export function MqttServiceClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [rules, setRules] = useState<AclRule[]>([]);
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

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [credRes, aclRes] = await Promise.all([
        fetch("/api/mqtt/session/credentials", { cache: "no-store" }),
        fetch("/api/mqtt/session/acl", { cache: "no-store" }),
      ]);
      const credData = (await credRes.json().catch(() => ({}))) as { error?: string; credentials?: Credential[] };
      const aclData = (await aclRes.json().catch(() => ({}))) as { error?: string; rules?: AclRule[] };
      if (!credRes.ok) throw new Error(credData.error || "โหลด credentials ไม่สำเร็จ");
      if (!aclRes.ok) throw new Error(aclData.error || "โหลด ACL ไม่สำเร็จ");
      setCredentials(credData.credentials ?? []);
      setRules(aclData.rules ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

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

  return (
    <div className="space-y-6">
      {loading ? <p className="text-sm text-slate-600">กำลังโหลด...</p> : null}
      {err ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      {generatedPassword ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          รหัสผ่านที่สร้างใหม่: <code>{generatedPassword}</code> (แสดงครั้งเดียว)
        </p>
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
                  <td className="px-3 py-2 text-slate-600">{c.last_seen_at ? new Date(c.last_seen_at).toLocaleString("th-TH") : "-"}</td>
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
                  <td className="px-3 py-2">{r.subject_type}:{r.subject_value}</td>
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

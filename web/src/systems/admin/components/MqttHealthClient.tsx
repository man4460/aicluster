"use client";

import { useCallback, useEffect, useState } from "react";

type MqttHealth = {
  enabled: boolean;
  brokerUrl: string | null;
  attachTopic: string;
  branchTopics: string[];
  connected: boolean;
  pendingByTopic: string[];
  recentEvents: Array<{ at: string; topic: string; raw: string }>;
};

export function MqttHealthClient() {
  const [data, setData] = useState<MqttHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/payments/melody/mqtt/health", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as Partial<MqttHealth> & { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "โหลดสถานะ MQTT ไม่สำเร็จ");
      setLoading(false);
      return;
    }
    setErr(null);
    setData(j as MqttHealth);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="MQTT Enabled" value={data ? (data.enabled ? "Yes" : "No") : "—"} />
          <Info label="Broker" value={data?.brokerUrl ?? "—"} mono />
          <Info label="Connected" value={data ? (data.connected ? "Connected" : "Disconnected") : "—"} />
          <Info label="Attach Topic" value={data?.attachTopic ?? "—"} mono />
          <Info label="Branch Topics" value={data?.branchTopics?.join(", ") || "—"} mono />
          <Info label="Pending By Topic" value={data?.pendingByTopic?.join(", ") || "ไม่มี"} mono />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Recent MQTT Events</h3>
        {loading ? <p className="mt-2 text-sm text-slate-500">กำลังโหลด...</p> : null}
        {!loading && (data?.recentEvents?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-slate-500">ยังไม่มี event ล่าสุด</p>
        ) : null}
        <div className="mt-3 space-y-2">
          {data?.recentEvents?.slice().reverse().map((e, idx) => (
            <div key={`${e.at}-${idx}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                {new Date(e.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} | topic:{" "}
                <span className="font-semibold text-slate-700">{e.topic}</span>
              </p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-700">
                {e.raw}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-sm text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}


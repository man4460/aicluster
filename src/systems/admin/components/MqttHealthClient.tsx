"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { downloadAdminExcel } from "@/lib/admin/export-excel";
import { cn } from "@/lib/cn";

type MqttHealth = {
  enabled: boolean;
  brokerUrl: string | null;
  attachTopic: string;
  branchTopics: string[];
  connected: boolean;
  pendingByTopic: string[];
  recentEvents: Array<{ at: string; topic: string; raw: string }>;
};

const fieldBox =
  "rounded-[1.25rem] border border-white/50 bg-white/45 px-4 py-3 backdrop-blur-sm ring-1 ring-inset ring-white/40 sm:rounded-[2rem]";

export function MqttHealthClient() {
  const [data, setData] = useState<MqttHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [manualRefresh, setManualRefresh] = useState(0);

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

  useEffect(() => {
    if (manualRefresh === 0) return;
    void load();
  }, [manualRefresh, load]);

  const events = data?.recentEvents?.slice().reverse() ?? [];
  const branchCount = data?.branchTopics?.length ?? 0;
  const pendingCount = data?.pendingByTopic?.length ?? 0;

  function onExportExcel() {
    downloadAdminExcel({
      filename: "admin-mqtt-events",
      sheetName: "เหตุการณ์",
      headers: ["เวลา", "Topic", "ข้อความ"],
      rows: events.map((e) => [
        new Date(e.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
        e.topic,
        e.raw,
      ]),
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-6",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
            aria-hidden
          >
            <IconMqttHero className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
              <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                สถานะ MQTT
              </span>
            </h1>
          </div>
        </div>
      </section>

      {err ? (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
          {err}
        </p>
      ) : null}

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="สรุปการเชื่อมต่อ"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onExportExcel}
                disabled={!data || events.length === 0}
                aria-label="Export Excel"
                title="Export Excel"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-1.5 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] disabled:opacity-50",
                )}
              >
                <IconExcel className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setManualRefresh((x) => x + 1);
                }}
                disabled={loading}
                aria-busy={loading}
                aria-label="รีเฟรชสถานะ MQTT"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-2 sm:px-4",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] shadow-sm hover:bg-white disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        {loading && !data ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[1.25rem] bg-[#ecebff]/70" />
            ))}
          </div>
        ) : data ? (
          <>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              <li>
                <div className={cn(fieldBox, "h-full")}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">เปิดใช้ MQTT</p>
                  <p className="mt-2 text-lg font-black text-[#1e1b4b]">{data.enabled ? "ใช่" : "ไม่"}</p>
                </div>
              </li>
              <li>
                <div className={cn(fieldBox, "h-full")}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">เชื่อมต่อ broker</p>
                  <p className={cn("mt-2 text-lg font-black", data.connected ? "text-emerald-700" : "text-rose-700")}>
                    {data.connected ? "เชื่อมแล้ว" : "ไม่เชื่อม"}
                  </p>
                </div>
              </li>
              <li>
                <div className={cn(fieldBox, "h-full")}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">Branch topics</p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-[#1e1b4b]">{branchCount}</p>
                </div>
              </li>
              <li>
                <div className={cn(fieldBox, "h-full")}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">Pending คิว</p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-amber-800">{pendingCount}</p>
                </div>
              </li>
              <li className="col-span-2">
                <div className={fieldBox}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">Broker URL</p>
                  <p className="mt-1 break-all font-mono text-xs leading-relaxed text-[#1e1b4b] sm:text-sm">
                    {data.brokerUrl ?? "—"}
                  </p>
                </div>
              </li>
              <li className="col-span-2">
                <div className={fieldBox}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">Attach topic</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#2e2a58] sm:text-sm">{data.attachTopic || "—"}</p>
                </div>
              </li>
            </ul>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className={fieldBox}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">Branch topics</p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-[#5f5a8a]">
                  {data.branchTopics?.length ? data.branchTopics.join(", ") : "—"}
                </p>
              </div>
              <div className={fieldBox}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">Pending by topic</p>
                <p className="mt-1 font-mono text-xs leading-relaxed text-[#5f5a8a]">
                  {data.pendingByTopic?.length ? data.pendingByTopic.join(", ") : "ไม่มี"}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <AppSectionHeader tone="violet" title="เหตุการณ์ล่าสุด" />
        <div className="mt-4">
          {events.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มี event ล่าสุด</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {events.map((e, idx) => (
                <li key={`${e.at}-${idx}`}>
                  <article className="group flex min-w-0 max-w-full flex-col gap-2 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 text-[#5b61ff] shadow-sm">
                        <IconPulse className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tabular-nums text-[#1e1b4b]">
                          {new Date(e.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                        </p>
                        <p className="mt-0.5 break-all font-mono text-xs font-bold leading-snug text-[#4d47b6]">
                          {e.topic}
                        </p>
                      </div>
                    </div>
                    <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-[#5f5a8a]">
                      {e.raw}
                    </pre>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppDashboardSection>
    </div>
  );
}

function IconMqttHero({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4.5 16.5c1-5 4-10 7.5-10s6.5 5 7.5 10" strokeLinecap="round" />
      <path d="M9 18c.5-2.5 2-4 3-4s2.5 1.5 3 4" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExcel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M8.5 17l3-4-3-4M12.5 9H15M12.5 17H15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPulse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

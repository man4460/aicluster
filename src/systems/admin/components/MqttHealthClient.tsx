"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
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
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5a8a]">
              ตรวจว่า backend ฟัง broker อยู่หรือไม่ topic ที่แนบ และเหตุการณ์ล่าสุด — รีเฟรชอัตโนมัติทุก 5 วินาที
            </p>
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
          description="สถานะหลักของบริการ MQTT ฝั่งเซิร์ฟเวอร์"
          action={
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
        <AppSectionHeader
          tone="violet"
          title="เหตุการณ์ล่าสุด"
          description="ข้อความดิบจาก broker (อ่านอย่างระมัดระวัง)"
        />
        <div className="mt-2 hidden overflow-hidden rounded-[1.25rem] border border-[#e8e6fc] md:block md:rounded-[2rem]">
          {events.length === 0 ? (
            <div className="p-4">
              <AppEmptyState tone="violet">ยังไม่มี event ล่าสุด</AppEmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e8e6fc] bg-[#faf9ff]/90 text-[11px] font-black uppercase tracking-wide text-[#66638c]">
                    <th className="px-4 py-3 font-black">เวลา</th>
                    <th className="px-4 py-3 font-black">Topic</th>
                    <th className="min-w-[280px] px-4 py-3 font-black">ข้อความ</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, idx) => (
                    <tr key={`${e.at}-${idx}`} className="border-b border-[#f0eefc]/90 align-top last:border-0 hover:bg-white/60">
                      <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#66638c]">
                        {new Date(e.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#4d47b6]">{e.topic}</td>
                      <td className="px-4 py-3">
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-[#1e1b4b]">
                          {e.raw}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-2 space-y-3 md:hidden">
          {events.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มี event ล่าสุด</AppEmptyState>
          ) : (
            events.map((e, idx) => (
              <article
                key={`${e.at}-${idx}`}
                className={cn(
                  "overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/55 via-white/30 to-indigo-50/20 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-[#5b61ff] shadow-sm">
                      <IconPulse className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">เวลา</p>
                      <p className="mt-0.5 text-xs font-semibold tabular-nums text-[#1e1b4b]">
                        {new Date(e.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-white/45 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">Topic</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-[#4d47b6]">{e.topic}</p>
                </div>
                <div className="mt-3 rounded-[1rem] border border-white/50 bg-white/45 p-3 backdrop-blur-sm">
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#1e1b4b]">
                    {e.raw}
                  </pre>
                </div>
              </article>
            ))
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

function IconPulse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

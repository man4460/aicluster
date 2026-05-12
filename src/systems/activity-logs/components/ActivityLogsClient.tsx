"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  actionLabelTh,
  activityLogModelLabelTh,
  humanizeActivityLogRow,
} from "@/systems/activity-logs/lib/humanize-activity-log";

export type ActivityLogsCalendarDefaults = {
  initialFrom: string;
  initialTo: string;
};

type ActivityLogRow = {
  id: string | number;
  actorUserId: string | null;
  action: string;
  modelName: string;
  payload: unknown;
  createdAt: string;
};

const fieldInputClass =
  "min-h-[44px] w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

export function ActivityLogsClient({ initialFrom, initialTo }: ActivityLogsCalendarDefaults) {
  const defaults = useMemo(() => ({ from: initialFrom, to: initialTo }), [initialFrom, initialTo]);

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [modelName, setModelName] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtersActive = useMemo(
    () =>
      modelName.trim().length > 0 ||
      action !== "" ||
      from !== defaults.from ||
      to !== defaults.to,
    [modelName, action, from, to, defaults.from, defaults.to],
  );

  const actionOptions = useMemo(
    () =>
      [
        { value: "", label: "ทุกประเภทการกระทำ" },
        { value: "CREATE", label: "เพิ่มข้อมูล (CREATE)" },
        { value: "UPDATE", label: "แก้ไขข้อมูล (UPDATE)" },
        { value: "UPSERT", label: "เพิ่มหรือแก้ไข (UPSERT)" },
        { value: "DELETE", label: "ลบข้อมูล (DELETE)" },
        { value: "CREATE_MANY", label: "เพิ่มหลายรายการ" },
        { value: "UPDATE_MANY", label: "แก้ไขหลายรายการ" },
        { value: "DELETE_MANY", label: "ลบหลายรายการ" },
      ] as const,
    [],
  );

  useEffect(() => {
    let done = false;
    async function load() {
      setLoading(true);
      setError(null);
      const sp = new URLSearchParams({ from, to, page: String(page), pageSize: "30" });
      if (modelName.trim()) sp.set("modelName", modelName.trim());
      if (action) sp.set("action", action);
      const res = await fetch(`/api/activity-logs?${sp.toString()}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        items?: ActivityLogRow[];
        totalPages?: number;
      };
      if (done) return;
      if (!res.ok) {
        setError(j.error ?? "โหลดข้อมูลไม่สำเร็จ");
        setRows([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      setRows(j.items ?? []);
      setTotalPages(Math.max(1, j.totalPages ?? 1));
      setLoading(false);
    }
    void load();
    return () => {
      done = true;
    };
  }, [from, to, modelName, action, page, reloadTick]);

  function resetFilters() {
    setFrom(defaults.from);
    setTo(defaults.to);
    setModelName("");
    setAction("");
    setPage(1);
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
            <IconActivityHero className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
              <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                ความเคลื่อนไหวระบบ
              </span>
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5a8a]">
              บันทึกการเพิ่ม แก้ไข และลบข้อมูลแบบแก้ไขย้อนหลังไม่ได้ — ระบบลบ log อัตโนมัติเมื่อเกิน{" "}
              <span className="font-bold text-[#4d47b6]">3 เดือน</span>
            </p>
          </div>
        </div>
      </section>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="บันทึกกิจกรรม"
          description="เลือกช่วงวันที่และตัวกรอง — ดูรายละเอียดแต่ละเหตุการณ์"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ปิดตัวกรอง" : "เปิดตัวกรอง"}
                title="ตัวกรอง"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 md:hidden sm:min-w-0 sm:gap-2 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6]",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">ตัวกรอง</span>
                {filtersActive ? (
                  <span
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setReloadTick((x) => x + 1)}
                disabled={loading}
                aria-busy={loading}
                aria-label="รีเฟรชข้อมูลรายงาน"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-2 sm:px-4",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6] shadow-sm hover:bg-white disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-0", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        <div
          className={cn(
            "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6",
            filterOpen ? "grid" : "hidden md:grid",
          )}
        >
          <Field label="ตั้งแต่วันที่">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66638c] md:hidden">
                <IconCalendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                className={cn(fieldInputClass, "md:pl-3 pl-10")}
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </Field>
          <Field label="ถึงวันที่">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66638c] md:hidden">
                <IconCalendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                className={cn(fieldInputClass, "md:pl-3 pl-10")}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </Field>
          <Field label="ชื่อตาราง (อังกฤษ)">
            <input
              className={fieldInputClass}
              value={modelName}
              onChange={(e) => {
                setModelName(e.target.value);
                setPage(1);
              }}
              placeholder="เช่น HomeFinanceEntry"
              autoComplete="off"
            />
          </Field>
          <Field label="การกระทำ">
            <select
              className={fieldInputClass}
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              {actionOptions.map((a) => (
                <option key={a.value || "ALL"} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col justify-end gap-2 lg:col-span-2">
            <p className="text-xs leading-snug text-[#66638c]">
              แสดงสูงสุด 30 รายการต่อหน้า · ข้อมูลกลางจากเซิร์ฟเวอร์
            </p>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!filtersActive}
              className={cn(
                appTemplateOutlineButtonClass,
                "min-h-[40px] text-sm disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-4 hidden overflow-hidden rounded-[1.25rem] border border-[#e8e6fc] md:block md:rounded-[2rem]">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-4">
                <AppEmptyState tone="violet">ยังไม่มีความเคลื่อนไหวในช่วงที่เลือก</AppEmptyState>
              </div>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e8e6fc] bg-[#faf9ff]/90 text-[11px] font-black uppercase tracking-wide text-[#66638c]">
                    <th className="px-4 py-3 font-black">เวลา</th>
                    <th className="px-4 py-3 font-black">การกระทำ</th>
                    <th className="px-4 py-3 font-black">ส่วนของระบบ</th>
                    <th className="min-w-[280px] px-4 py-3 font-black">สรุป</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={String(r.id)}
                      className="border-b border-[#f0eefc]/90 align-top transition-colors last:border-0 hover:bg-white/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#66638c]">
                        {new Date(r.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={r.action} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#2e2a58]">{activityLogModelLabelTh(r.modelName)}</span>
                        <span className="mt-0.5 block font-mono text-[10px] text-[#66638c]">{r.modelName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm leading-relaxed text-[#1e1b4b]">
                        {humanizeActivityLogRow(r.action, r.modelName, r.payload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {loading ? (
            <MobileSkeleton />
          ) : rows.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มีความเคลื่อนไหวในช่วงที่เลือก</AppEmptyState>
          ) : (
            rows.map((r) => (
              <article
                key={String(r.id)}
                className={cn(
                  "overflow-hidden rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/55 via-white/30 to-indigo-50/20 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-[#5b61ff] shadow-sm">
                      <IconClock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">เวลา</p>
                      <p className="mt-0.5 text-xs font-semibold tabular-nums leading-snug text-[#1e1b4b]">
                        {new Date(r.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                      </p>
                    </div>
                  </div>
                  <ActionBadge action={r.action} />
                </div>

                <div className="mt-3 flex items-start justify-between gap-3 border-t border-white/45 pt-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">ส่วนของระบบ</p>
                    <p className="mt-0.5 font-black text-[#2e2a58]">{activityLogModelLabelTh(r.modelName)}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-[#66638c]">{r.modelName}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-[1rem] border border-white/50 bg-white/45 px-3 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">สรุป</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#1e1b4b]">
                    {humanizeActivityLogRow(r.action, r.modelName, r.payload)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[#e8e6fc]/80 bg-[#faf9ff]/50 px-4 py-3 sm:rounded-[2rem]">
          <p className="text-xs font-medium text-[#66638c]">
            หน้า <span className="font-black tabular-nums text-[#1e1b4b]">{page}</span> /{" "}
            <span className="tabular-nums">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 disabled:opacity-40",
              )}
              aria-label="หน้าก่อนหน้า"
              title="ก่อนหน้า"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 disabled:opacity-40",
              )}
              aria-label="หน้าถัดไป"
              title="ถัดไป"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </AppDashboardSection>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const tone = actionTone(action);
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1",
        tone,
      )}
    >
      <span className="truncate">{actionLabelTh(action)}</span>
    </span>
  );
}

function actionTone(action: string): string {
  if (action.includes("DELETE")) {
    return "bg-rose-500/12 text-rose-900 ring-rose-200/80";
  }
  if (action === "CREATE" || action === "CREATE_MANY") {
    return "bg-emerald-500/12 text-emerald-900 ring-emerald-200/80";
  }
  if (action.includes("UPDATE") || action === "UPSERT") {
    return "bg-sky-500/12 text-sky-900 ring-sky-200/80";
  }
  return "bg-slate-500/10 text-slate-800 ring-slate-200/80";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-[#5f5a8a]">{label}</label>
      {children}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-[#ecebff]/70" />
      ))}
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-[1.25rem] border border-white/40 bg-gradient-to-br from-white/40 to-indigo-50/20"
        />
      ))}
    </div>
  );
}

function IconActivityHero({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
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

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

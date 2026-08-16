"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { downloadAdminExcel } from "@/lib/admin/export-excel";
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
  "min-h-[44px] w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#4d47b6]/40 focus:ring-2 focus:ring-[#4d47b6]/20";

function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

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

  function onExportExcel() {
    downloadAdminExcel({
      filename: `admin-activity-logs-page${page}`,
      sheetName: "กิจกรรม",
      headers: ["เวลา", "การกระทำ", "ส่วนของระบบ", "modelName", "สรุป"],
      rows: rows.map((r) => [
        formatActivityTime(r.createdAt),
        actionLabelTh(r.action),
        activityLogModelLabelTh(r.modelName),
        r.modelName,
        humanizeActivityLogRow(r.action, r.modelName, r.payload),
      ]),
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="บันทึกกิจกรรม"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="activity-logs-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:px-3",
                  "border-[#dcd8f0] bg-white/80 text-[#4d47b6]",
                  filterOpen && "border-[#4d47b6]/45 bg-[#ecebff]/90 ring-2 ring-[#4d47b6]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span className="hidden sm:ml-1 sm:inline">{filterOpen ? "ซ่อนกรอง" : "กรอง"}</span>
                {filtersActive ? (
                  <span
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#4d47b6] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button
                type="button"
                onClick={onExportExcel}
                disabled={loading || rows.length === 0}
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
          id="activity-logs-filter-panel"
          className={cn(
            "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6",
            filterOpen ? "grid" : "hidden",
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

        <div className="mt-4">
          {loading ? (
            <ul className="grid grid-cols-1 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-[#ecebff]/70" />
              ))}
            </ul>
          ) : rows.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มีความเคลื่อนไหวในช่วงที่เลือก</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {rows.map((r) => (
                <li key={String(r.id)}>
                  <article className="group flex min-w-0 max-w-full flex-col gap-2 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-[#ecebff] to-indigo-100/40 text-[#4d47b6] shadow-sm">
                        <IconClock className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold tabular-nums text-[#1e1b4b]">
                            {formatActivityTime(r.createdAt)}
                          </p>
                          <ActionBadge action={r.action} />
                        </div>
                        <p className="mt-0.5 break-words text-sm font-black leading-snug text-[#2e2a58]">
                          {activityLogModelLabelTh(r.modelName)}
                        </p>
                        <p className="mt-0.5 break-all font-mono text-[10px] leading-snug text-[#66638c]">
                          {r.modelName}
                        </p>
                      </div>
                    </div>
                    <p className="break-words text-xs leading-relaxed text-[#5f5a8a]">
                      {humanizeActivityLogRow(r.action, r.modelName, r.payload)}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
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

function IconExcel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M8.5 17l3-4-3-4M12.5 9H15M12.5 17H15" strokeLinecap="round" strokeLinejoin="round" />
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

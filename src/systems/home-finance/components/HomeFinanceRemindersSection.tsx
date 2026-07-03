"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { HomeFinanceStatCard } from "@/systems/home-finance/components/HomeFinanceStatCard";
import {
  HomeFinanceEmptyState,
  HomeFinanceEntityActions,
  HomeFinanceEntityMain,
  HomeFinanceEntityRow,
  HomeFinanceList,
  HomeFinanceListHeading,
  HomeFinancePageSection,
  HomeFinanceRowActionIconButton,
  HomeFinanceRowIconTrash,
  HomeFinanceSectionHeader,
} from "@/systems/home-finance/components/HomeFinanceUi";
import { hfFilterChipClass } from "@/systems/home-finance/components/home-finance-ui-tokens";
import {
  dueDiffLabel,
  formatDueDateLabel,
  getBrowserNotifyPermission,
  loadReminderNotifyPrefs,
  notifyDueAlertsIfEnabled,
  requestBrowserNotifyPermission,
  saveReminderNotifyPrefs,
  type BrowserNotifyPermission,
  type HomeFinanceDueAlert,
} from "@/systems/home-finance/lib/reminder-notify";

type Reminder = {
  id: number;
  title: string;
  dueDate: string;
  note: string | null;
  isDone: boolean;
};

type ReminderFilter = "pending" | "done" | "all";

function urgencyTone(diff: number): "rose" | "amber" | "blue" | "slate" {
  if (diff < 0) return "rose";
  if (diff === 0) return "amber";
  if (diff <= 3) return "blue";
  return "slate";
}

const urgencyBorderClass: Record<ReturnType<typeof urgencyTone>, string> = {
  rose: "border-l-rose-500 bg-gradient-to-r from-rose-50/90 to-white/80",
  amber: "border-l-amber-500 bg-gradient-to-r from-amber-50/90 to-white/80",
  blue: "border-l-[#5b61ff] bg-gradient-to-r from-indigo-50/80 to-white/80",
  slate: "border-l-slate-300 bg-gradient-to-r from-slate-50/80 to-white/80",
};

const urgencyBadgeClass: Record<ReturnType<typeof urgencyTone>, string> = {
  rose: "bg-rose-100 text-rose-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-[#0000BF]/10 text-[#0000BF]",
  slate: "bg-slate-100 text-slate-600",
};

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.85}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function IconUndo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.85}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
      />
    </svg>
  );
}

function DueAlertCard({ alert }: { alert: HomeFinanceDueAlert }) {
  const tone = urgencyTone(alert.diff);
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/70 border-l-4 p-3.5 shadow-sm backdrop-blur-sm sm:p-4",
        urgencyBorderClass[tone],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            urgencyBadgeClass[tone],
          )}
        >
          {alert.kind}
        </span>
        <span className={cn("text-xs font-bold tabular-nums", urgencyBadgeClass[tone], "rounded-full px-2 py-0.5")}>
          {dueDiffLabel(alert.diff)}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-snug text-[#1f2240]">{alert.title}</p>
      <p className="mt-1 text-xs text-[#66638c] tabular-nums">{formatDueDateLabel(alert.dueDate)}</p>
      {alert.note ? <p className="mt-1.5 text-xs text-[#8b8fb3]">{alert.note}</p> : null}
    </div>
  );
}

function NotifyToggleRow({
  enabled,
  permission,
  busy,
  onToggle,
  onRequestPermission,
}: {
  enabled: boolean;
  permission: BrowserNotifyPermission;
  busy: boolean;
  onToggle: (next: boolean) => void;
  onRequestPermission: () => void;
}) {
  const statusText =
    permission === "unsupported"
      ? "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน"
      : permission === "denied"
        ? "ถูกบล็อก — เปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์"
        : permission === "granted" && enabled
          ? "เปิดอยู่ — จะเตือนเมื่อครบกำหนดวันนี้ / พรุ่งนี้ / เกินกำหนด"
          : permission === "granted"
            ? "อนุญาตแล้ว แต่ยังปิดการแจ้งเตือน"
            : "ยังไม่ได้อนุญาต — กดเปิดเพื่อขอสิทธิ์";

  return (
    <div className="rounded-[1.4rem] border border-white/65 bg-gradient-to-br from-white/85 via-white/70 to-[#eef1ff]/72 p-4 shadow-sm ring-1 ring-white/65 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5b61ff]/10 text-[#5b61ff]">
              <IconBell className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#1f2240]">แจ้งเตือนบนเบราว์เซอร์</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#66638c]">{statusText}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled && permission === "granted"}
          aria-label="เปิดการแจ้งเตือนบนเบราว์เซอร์"
          disabled={busy || permission === "unsupported" || permission === "denied"}
          onClick={() => {
            if (permission !== "granted") {
              onRequestPermission();
              return;
            }
            onToggle(!enabled);
          }}
          className={cn(
            "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors touch-manipulation",
            enabled && permission === "granted"
              ? "border-[#5b61ff]/40 bg-[#5b61ff]"
              : "border-slate-200 bg-slate-200",
            (busy || permission === "unsupported" || permission === "denied") && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className={cn(
              "inline-block h-6 w-6 translate-x-1 rounded-full bg-white shadow transition-transform",
              enabled && permission === "granted" && "translate-x-7",
            )}
          />
        </button>
      </div>
      {permission === "default" ? (
        <button
          type="button"
          onClick={() => onRequestPermission()}
          disabled={busy}
          className="mt-3 min-h-[40px] w-full rounded-xl border border-[#5b61ff]/25 bg-[#5b61ff]/8 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-[#5b61ff]/12 disabled:opacity-60"
        >
          {busy ? "กำลังขอสิทธิ์…" : "อนุญาตการแจ้งเตือน"}
        </button>
      ) : null}
    </div>
  );
}

export function HomeFinanceRemindersSection({
  reminders,
  dueAlerts,
  todayYmd,
  onAdd,
  onToggleDone,
  onRemove,
}: {
  reminders: Reminder[];
  dueAlerts: HomeFinanceDueAlert[];
  todayYmd: string;
  onAdd: () => void;
  onToggleDone: (id: number, isDone: boolean) => void;
  onRemove: (id: number) => void;
}) {
  const [filter, setFilter] = useState<ReminderFilter>("pending");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState<BrowserNotifyPermission>("default");
  const [notifyBusy, setNotifyBusy] = useState(false);

  useEffect(() => {
    setNotifyEnabled(loadReminderNotifyPrefs().enabled);
    setNotifyPermission(getBrowserNotifyPermission());
  }, []);

  const runNotifyCheck = useCallback(() => {
    notifyDueAlertsIfEnabled(dueAlerts, todayYmd);
  }, [dueAlerts, todayYmd]);

  useEffect(() => {
    if (!notifyEnabled || notifyPermission !== "granted") return;
    runNotifyCheck();
    const id = window.setInterval(runNotifyCheck, 30 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") runNotifyCheck();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [notifyEnabled, notifyPermission, runNotifyCheck]);

  const stats = useMemo(() => {
    const overdue = dueAlerts.filter((a) => a.diff < 0).length;
    const today = dueAlerts.filter((a) => a.diff === 0).length;
    const upcoming = dueAlerts.filter((a) => a.diff > 0).length;
    const done = reminders.filter((r) => r.isDone).length;
    return { overdue, today, upcoming, done };
  }, [dueAlerts, reminders]);

  const filteredReminders = useMemo(() => {
    const list =
      filter === "pending"
        ? reminders.filter((r) => !r.isDone)
        : filter === "done"
          ? reminders.filter((r) => r.isDone)
          : reminders;
    return [...list].sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [reminders, filter]);

  async function handleRequestPermission() {
    setNotifyBusy(true);
    try {
      const perm = await requestBrowserNotifyPermission();
      setNotifyPermission(perm);
      if (perm === "granted") {
        setNotifyEnabled(true);
        saveReminderNotifyPrefs({ enabled: true });
        notifyDueAlertsIfEnabled(dueAlerts, todayYmd);
      }
    } finally {
      setNotifyBusy(false);
    }
  }

  function handleNotifyToggle(next: boolean) {
    setNotifyEnabled(next);
    saveReminderNotifyPrefs({ enabled: next });
    if (next) runNotifyCheck();
  }

  return (
    <HomeFinancePageSection>
      <HomeFinanceSectionHeader
        title="แจ้งเตือน"
        description="ดูรายการใกล้ครบกำหนด · บันทึกเตือนความจำ · เปิดแจ้งเตือนบนเบราว์เซอร์ได้"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            onClick={onAdd}
            aria-label="เพิ่มแจ้งเตือน"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[#0000BF] px-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a6] sm:min-w-0 sm:px-4"
          >
            <span className="text-lg leading-none sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มแจ้งเตือน</span>
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <HomeFinanceStatCard title="เกินกำหนด" value={String(stats.overdue)} tone="rose" />
        <HomeFinanceStatCard title="ครบวันนี้" value={String(stats.today)} tone="amber" />
        <HomeFinanceStatCard title="7 วันข้างหน้า" value={String(stats.upcoming)} tone="blue" />
        <HomeFinanceStatCard
          title="ทำเสร็จแล้ว"
          value={String(stats.done)}
          tone="green"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="mb-5">
        <NotifyToggleRow
          enabled={notifyEnabled}
          permission={notifyPermission}
          busy={notifyBusy}
          onToggle={handleNotifyToggle}
          onRequestPermission={() => void handleRequestPermission()}
        />
      </div>

      <div className="mb-6">
        <HomeFinanceListHeading>ใกล้ครบกำหนด (7 วัน) — {dueAlerts.length} รายการ</HomeFinanceListHeading>
        {dueAlerts.length === 0 ? (
          <HomeFinanceEmptyState>ไม่มีรายการครบกำหนดในช่วง 7 วันนี้ 🎉</HomeFinanceEmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {dueAlerts.map((a, i) => (
              <DueAlertCard key={`${a.kind}-${a.title}-${a.dueDate}-${i}`} alert={a} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <HomeFinanceListHeading className="mb-0">
            รายการที่บันทึกเอง ({reminders.length})
          </HomeFinanceListHeading>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["pending", "รอทำ"],
                ["done", "เสร็จแล้ว"],
                ["all", "ทั้งหมด"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={hfFilterChipClass(filter === key)}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <HomeFinanceList>
          {filteredReminders.length === 0 ? (
            <HomeFinanceEmptyState>
              {filter === "pending"
                ? "ไม่มีรายการรอทำ — กด + เพื่อเพิ่มแจ้งเตือน"
                : filter === "done"
                  ? "ยังไม่มีรายการที่ทำเสร็จ"
                  : "ยังไม่มีรายการ — กด + เพื่อเพิ่มแจ้งเตือน"}
            </HomeFinanceEmptyState>
          ) : (
            filteredReminders.map((r) => {
              const dueYmd = r.dueDate.slice(0, 10);
              const diff = Math.ceil(
                (new Date(`${dueYmd}T00:00:00Z`).getTime() - new Date(`${todayYmd}T00:00:00Z`).getTime()) /
                  (24 * 60 * 60 * 1000),
              );
              const tone = r.isDone ? "slate" : urgencyTone(diff);
              return (
                <HomeFinanceEntityRow
                  key={r.id}
                  className={cn(
                    "items-start border-l-4",
                    r.isDone ? "border-l-slate-200 opacity-75" : urgencyBorderClass[tone],
                  )}
                >
                  <HomeFinanceEntityMain className="items-start gap-3">
                    <button
                      type="button"
                      aria-label={r.isDone ? `เปิดใหม่ ${r.title}` : `ทำเสร็จแล้ว ${r.title}`}
                      title={r.isDone ? "เปิดใหม่" : "ทำเสร็จแล้ว"}
                      onClick={() => void onToggleDone(r.id, r.isDone)}
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border touch-manipulation transition",
                        r.isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : "border-slate-200 bg-white/80 text-slate-400 hover:border-[#5b61ff]/40 hover:text-[#5b61ff]",
                      )}
                    >
                      {r.isDone ? <IconCheck className="h-5 w-5" /> : <span className="h-4 w-4 rounded-md border-2 border-current" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold text-slate-900",
                          r.isDone && "text-slate-500 line-through",
                        )}
                      >
                        {r.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {formatDueDateLabel(dueYmd)}
                        {!r.isDone ? (
                          <span className={cn("ml-1.5 font-semibold", urgencyBadgeClass[tone], "rounded px-1.5 py-0.5")}>
                            {dueDiffLabel(diff)}
                          </span>
                        ) : (
                          <span className="ml-1.5 text-emerald-600">· เสร็จแล้ว</span>
                        )}
                      </p>
                      {r.note ? <p className="mt-1 text-xs text-slate-400">{r.note}</p> : null}
                    </div>
                  </HomeFinanceEntityMain>
                  <HomeFinanceEntityActions>
                    {r.isDone ? (
                      <HomeFinanceRowActionIconButton
                        variant="muted"
                        title="เปิดใหม่"
                        onClick={() => void onToggleDone(r.id, r.isDone)}
                      >
                        <IconUndo className="h-4 w-4" />
                      </HomeFinanceRowActionIconButton>
                    ) : null}
                    <HomeFinanceRowActionIconButton
                      variant="danger"
                      title="ลบ"
                      onClick={() => void onRemove(r.id)}
                    >
                      <HomeFinanceRowIconTrash />
                    </HomeFinanceRowActionIconButton>
                  </HomeFinanceEntityActions>
                </HomeFinanceEntityRow>
              );
            })
          )}
        </HomeFinanceList>
      </div>
    </HomeFinancePageSection>
  );
}

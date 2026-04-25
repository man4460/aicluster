"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import {
  PERSONAL_AI_CHAT_DIGEST_ASIDE_CLASS,
  PERSONAL_AI_CHAT_DIGEST_INNER_CLASS,
  PERSONAL_AI_DIGEST_ASIDE_ARIA_LABEL,
} from "@/systems/chat/personal-ai-chat-shell";
import { cn } from "@/lib/cn";
import type {
  DailyDigestFinance,
  DailyDigestNote,
  DailyDigestResponse,
  DailyReminderItem,
} from "@/lib/reminders/daily-reminder-types";
import {
  DIGEST_HEADLINE_MAX,
  digestReminderDisplay,
  headlineWithoutDuplicateTime,
  isGenericQuickNoteAttribution,
  splitDigestText,
  stripDigestNoise,
} from "@/lib/reminders/personal-digest-text";
import { formatActivityTimeThLabel } from "@/lib/reminders/activity-time-from-text";
import { formatBangkokDigestDateLabel, formatBangkokYmd } from "@/lib/reminders/bangkok-calendar";
import { PersonalDigestItemDialog, type PersonalDigestItemDialogPayload } from "./PersonalDigestItemDialog";

const NOTES_SIDEBAR_MAX = 5;

const DIGEST_SESSION_STORAGE_KEY = "mia-personal-daily-digest.v1";

function readCachedDigest(): DailyDigestResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DIGEST_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { payload?: DailyDigestResponse };
    const p = parsed?.payload;
    if (!p || typeof p.todayYmd !== "string" || !Array.isArray(p.today)) return null;
    if (p.todayYmd !== formatBangkokYmd()) return null;
    return p;
  } catch {
    return null;
  }
}

function writeCachedDigest(payload: DailyDigestResponse): void {
  try {
    sessionStorage.setItem(DIGEST_SESSION_STORAGE_KEY, JSON.stringify({ payload }));
  } catch {
    /* quota / private mode */
  }
}

const DIGEST_BTN_SOFT =
  "app-btn-soft rounded-xl border border-[#dcd8f0] text-[11px] font-semibold text-[#4d47b6] shadow-sm transition hover:bg-[#f4f3ff] disabled:opacity-50";

/**
 * โทนสีแยกหมวด — ใช้แถบซ้าย + หัวข้อ + พื้นการ์ดรายการเท่านั้น (ไม่ไล่ไล่หลายชั้น)
 */
const DIGEST_VARIANT = {
  today: {
    accent: "border-l-[#6366f1]",
    title: "text-[#3730a3]",
    itemSurface: "border-[#c7d2fe]/90 bg-gradient-to-br from-[#eef2ff]/90 to-white",
  },
  tomorrow: {
    accent: "border-l-[#4f46e5]",
    title: "text-[#312e81]",
    itemSurface: "border-[#ddd6fe]/80 bg-gradient-to-br from-[#f5f3ff]/90 to-white",
  },
  pending: {
    accent: "border-l-amber-500",
    title: "text-amber-900",
    itemSurface: "border-amber-100/85 bg-gradient-to-br from-amber-50/80 to-white",
  },
  /** สรุปจำนวนรายการรายรับ–รายจ่ายวันนี้ */
  financeEntries: {
    accent: "border-l-teal-500",
    title: "text-teal-900",
    itemSurface: "border-teal-100/75 bg-gradient-to-br from-teal-50/45 to-white",
  },
  notes: {
    accent: "border-l-[#0000BF]",
    title: "text-[#1a1550]",
    itemSurface: "border-[#0000BF]/18 bg-gradient-to-br from-[#0000BF]/[0.06] to-white",
  },
} as const;

/** การ์ดรายการในรายการ — ใช้ร่วมกันทุกหมวด */
const DIGEST_ITEM_CARD =
  "min-w-0 list-none rounded-xl border border-[#e4e2f5]/90 bg-white/95 px-3 py-2.5 shadow-md shadow-indigo-950/[0.05] outline-none transition-[box-shadow,transform] hover:border-[#0000BF]/15 hover:shadow-lg hover:shadow-indigo-950/10";

const DIGEST_SECTION_SHELL =
  "overflow-hidden rounded-2xl border border-[#e8e6fc] bg-white/98 shadow-lg shadow-indigo-950/[0.07] ring-1 ring-white/90 backdrop-blur-[2px]";
const DIGEST_SECTION_HEAD =
  "border-b border-[#ebe9f7] bg-gradient-to-r from-white via-[#faf9ff] to-[#f3f1fc]/80 px-3.5 py-2.5";
const DIGEST_SECTION_BODY = "space-y-2.5 bg-gradient-to-b from-[#faf9ff]/40 to-[#f8f7fd]/25 px-3 py-3";

function formatBaht(n: number): string {
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

/** สรุปจำนวนรายการรายรับ–รายจ่ายวันนี้ในแถบซ้าย */
function FinanceTodayEntriesOverviewPanel({ finance }: { finance: DailyDigestFinance }) {
  if (!finance.available) {
    return (
      <AppEmptyState className="rounded-xl border border-dashed border-teal-200/80 bg-white/75 px-3 py-4 text-center text-xs leading-relaxed text-slate-600 shadow-inner">
        สรุปรายการใช้ได้เมื่อเข้าด้วยบัญชีเจ้าของ
      </AppEmptyState>
    );
  }

  const income = finance.incomeBaht;
  const expense = finance.expenseBaht;
  const entries = finance.entries ?? [];
  const incomeEntryCount = entries.filter((e) => e.type === "INCOME").length;
  const expenseEntryCount = entries.filter((e) => e.type === "EXPENSE").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/45 via-white to-cyan-50/25 p-3 shadow-md shadow-teal-950/[0.04] ring-1 ring-white/80">
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-xl border border-white/80 bg-white/90 px-1.5 py-2 shadow-sm">
          <p className="text-lg font-bold tabular-nums leading-none text-slate-800">{entries.length}</p>
          <p className="mt-1 text-[9px] font-medium text-slate-500">ทั้งหมด</p>
        </div>
        <div className="rounded-xl border border-emerald-100/90 bg-emerald-50/50 px-1.5 py-2 shadow-sm">
          <p className="text-lg font-bold tabular-nums leading-none text-emerald-700">{incomeEntryCount}</p>
          <p className="mt-1 text-[9px] font-medium text-emerald-800/80">รายรับ</p>
        </div>
        <div className="rounded-xl border border-rose-100/90 bg-rose-50/40 px-1.5 py-2 shadow-sm">
          <p className="text-lg font-bold tabular-nums leading-none text-rose-700">{expenseEntryCount}</p>
          <p className="mt-1 text-[9px] font-medium text-rose-800/75">รายจ่าย</p>
        </div>
      </div>
      {income > 0 ? (
        <p className="mt-2.5 border-t border-teal-100/80 pt-2 text-center text-[11px] leading-snug text-slate-600">
          ใช้จากรายรับวันนี้ไป{" "}
          <span className="font-bold tabular-nums text-teal-800">
            {Math.min(100, Math.round((expense / income) * 100))}%
          </span>
          {expense > income ? (
            <span className="block text-[10px] font-medium text-amber-800/90">เกินรายรับ — ตรวจรายการหรือเปิดหน้าบัญชีจากเมนู</span>
          ) : null}
        </p>
      ) : entries.length > 0 ? (
        <p className="mt-2.5 border-t border-teal-100/80 pt-2 text-center text-[10px] text-slate-500">
          ยังไม่มีรายรับวันนี้ — แสดงเฉพาะรายจ่าย
        </p>
      ) : (
        <p className="mt-2.5 border-t border-teal-100/80 pt-2 text-center text-[10px] text-slate-500">
          ลงรายการในบัญชีเพื่อดูสัดส่วนที่นี่
        </p>
      )}

      {entries.length > 0 ? (
        <div className="mt-2.5 border-t border-teal-100/80 pt-2">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-teal-900/70">รายละเอียดรายการ</p>
          <ul className="m-0 max-h-[9.5rem] list-none space-y-1 overflow-y-auto overscroll-contain p-0 [scrollbar-gutter:stable] pr-0.5">
            {entries.slice(0, 10).map((e) => {
              const titleShort = e.title.length > 36 ? `${e.title.slice(0, 36)}…` : e.title;
              return (
                <li
                  key={e.id}
                  className="flex min-w-0 items-start justify-between gap-1.5 rounded-lg border border-teal-100/50 bg-white/70 px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium leading-snug text-slate-700" title={e.title}>
                      {titleShort}
                    </p>
                    {e.categoryLabel && e.categoryLabel !== "อื่นๆ" ? (
                      <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-400">{e.categoryLabel}</p>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-[10px] font-bold tabular-nums leading-none",
                      e.type === "INCOME" ? "text-emerald-700" : "text-rose-700",
                    )}
                  >
                    {e.type === "INCOME" ? "+" : "−"}฿{formatBaht(e.amountBaht)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DigestNoteCards({
  notes,
  onSelect,
}: {
  notes: DailyDigestNote[];
  onSelect: (note: DailyDigestNote) => void;
}) {
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {notes.map((n) => {
        const noteActivity = formatActivityTimeThLabel(n.content);
        let { headline, detail } = splitDigestText(n.content);
        headline = headlineWithoutDuplicateTime(headline, noteActivity);
        if (!headline.trim()) {
          headline = stripDigestNoise(String(n.content ?? "").slice(0, DIGEST_HEADLINE_MAX));
        }
        return (
          <li key={n.id} className="list-none p-0">
            <button
              type="button"
              onClick={() => onSelect(n)}
              className={cn(
                DIGEST_ITEM_CARD,
                DIGEST_VARIANT.notes.itemSurface,
                "w-full text-left",
                "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/30",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                {noteActivity ? (
                  <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200/80 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-slate-700">
                    {noteActivity}
                  </span>
                ) : null}
                <p className="break-words text-[13px] font-medium leading-snug text-slate-900">{headline}</p>
                {detail ? <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{detail}</p> : null}
                <p className="text-[10px] text-slate-500">{formatBangkokDigestDateLabel(n.createdAt)}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarSectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-[13px] font-semibold leading-tight tracking-tight text-[#2e2a58]", className)}>
      {children}
    </h3>
  );
}

function DigestSection({
  variant,
  title,
  titleExtra,
  titleClassName,
  bodyClassName,
  children,
}: {
  variant: keyof typeof DIGEST_VARIANT;
  title: string;
  titleExtra?: ReactNode;
  /** เน้นหัวข้อหมวดให้แยกจากเนื้อหาด้านล่าง */
  titleClassName?: string;
  /** ปรับพื้น body รายหมวด */
  bodyClassName?: string;
  children: ReactNode;
}) {
  const v = DIGEST_VARIANT[variant];
  const dotBg =
    variant === "today"
      ? "bg-[#6366f1]"
      : variant === "tomorrow"
        ? "bg-[#4f46e5]"
        : variant === "pending"
          ? "bg-amber-500"
          : variant === "financeEntries"
            ? "bg-teal-500"
            : "bg-[#0000BF]";
  return (
    <section className={cn(DIGEST_SECTION_SHELL, "border-l-[3px]", v.accent)}>
      <div className={DIGEST_SECTION_HEAD}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full ring-2 ring-white shadow-sm", dotBg)}
              aria-hidden
            />
            <SidebarSectionTitle className={cn("min-w-0", v.title, titleClassName)}>{title}</SidebarSectionTitle>
          </div>
          {titleExtra}
        </div>
      </div>
      <div className={cn(DIGEST_SECTION_BODY, bodyClassName)}>{children}</div>
    </section>
  );
}

function ReminderLine({
  item,
  showPersonalPlanDueRow,
  cardClassName,
  onSelect,
}: {
  item: DailyReminderItem;
  showPersonalPlanDueRow?: boolean;
  /** ถ้ามี แสดงเป็นการ์ดแยกรายการ (เช่น วันนี้ / พรุ่งนี้) */
  cardClassName?: string;
  onSelect?: (item: DailyReminderItem) => void;
}) {
  const titleSafe = String(item.title ?? "");
  const dueTimeSafe = String(item.dueTime ?? "").trim();
  const showTime = Boolean(dueTimeSafe && /^\d{2}:\d{2}$/.test(dueTimeSafe));
  const activityFromText =
    !showTime && titleSafe.trim() ? formatActivityTimeThLabel(titleSafe) : null;
  const timeLabel = showTime ? `${dueTimeSafe} น.` : activityFromText;
  const done = item.status === "done";
  let { headline, detail } = digestReminderDisplay(item);
  headline = headlineWithoutDuplicateTime(headline, timeLabel);
  if (!headline.trim() && titleSafe.trim()) {
    headline = stripDigestNoise(titleSafe.slice(0, DIGEST_HEADLINE_MAX));
  }
  if (detail && isGenericQuickNoteAttribution(detail)) {
    detail = null;
  }
  const planDueRow =
    showPersonalPlanDueRow && item.source === "personal_plan" && !showTime && item.dueDate ? (
      <span className="mt-1 block text-[10px] text-slate-500">
        ครบ{" "}
        {/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)
          ? formatBangkokDigestDateLabel(`${item.dueDate}T12:00:00.000Z`)
          : item.dueDate}
      </span>
    ) : null;

  const surface = cardClassName?.trim() ? cardClassName : "border-slate-200/90 bg-white";

  const content = (
    <div className="flex min-w-0 flex-col gap-1.5">
      {timeLabel ? (
        <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200/80 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-slate-700">
          {timeLabel}
        </span>
      ) : null}
      <div className={cn("min-w-0", done && "text-slate-400 line-through")}>
        <p className="break-words text-[13px] font-medium leading-snug text-slate-900">{headline}</p>
        {detail ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{detail}</p>
        ) : null}
      </div>
      {planDueRow}
    </div>
  );

  if (onSelect) {
    return (
      <li className="list-none p-0">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            DIGEST_ITEM_CARD,
            surface,
            "w-full text-left",
            "cursor-pointer outline-none transition focus-visible:ring-2 focus-visible:ring-[#0000BF]/30",
            done && "opacity-90",
          )}
        >
          {content}
        </button>
      </li>
    );
  }

  return <li className={cn(DIGEST_ITEM_CARD, surface)}>{content}</li>;
}

function ReminderList({
  items,
  emptyLabel,
  showPersonalPlanDueRow,
  itemCardClassName,
  onItemSelect,
}: {
  items: DailyReminderItem[];
  emptyLabel: string;
  showPersonalPlanDueRow?: boolean;
  itemCardClassName?: string;
  onItemSelect?: (item: DailyReminderItem) => void;
}) {
  if (!items.length) {
    return (
      <AppEmptyState className="rounded-xl border border-dashed border-slate-200/90 bg-white/60 py-4 text-center text-[11px] text-slate-500 shadow-inner shadow-slate-900/5">
        {emptyLabel}
      </AppEmptyState>
    );
  }
  return (
    <ul className="m-0 list-none space-y-2.5 p-0">
      {items.map((item) => (
        <ReminderLine
          key={item.id}
          item={item}
          showPersonalPlanDueRow={showPersonalPlanDueRow}
          cardClassName={itemCardClassName}
          onSelect={onItemSelect}
        />
      ))}
    </ul>
  );
}

/** แถบสรุปรายวัน (ซ้าย) — ใช้ร่วมกับ `ChatAiSkeleton` ให้ได้ `<aside id="personal-ai-digest">` ตัวเดียวกันทุกที่ */
export function PersonalAiDigestAsideFrame({
  className,
  children,
  suppressHydrationWarning,
}: {
  className?: string;
  children: ReactNode;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <aside
      id="personal-ai-digest"
      className={cn(PERSONAL_AI_CHAT_DIGEST_ASIDE_CLASS, className)}
      aria-label={PERSONAL_AI_DIGEST_ASIDE_ARIA_LABEL}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      <div className={PERSONAL_AI_CHAT_DIGEST_INNER_CLASS}>{children}</div>
    </aside>
  );
}

export function PersonalAiDailyDigest({
  className,
  /** เพิ่มค่าทุกครั้งหลังแชทสำเร็จ เพื่อดึงบันทึก/ตารางใหม่ */
  refreshKey,
  onOpenAllNotes,
  /** หลังแก้ไขโน้ตหรือซ่อนจากแถบสรุป — รีเฟรช digest */
  onNotesChanged,
}: {
  className?: string;
  refreshKey?: number;
  onOpenAllNotes?: () => void;
  onNotesChanged?: () => void;
}) {
  /** SSR + เฟรม hydrate แรกต้องเป็น `null` เสมอ — อ่าน sessionStorage หลัง mount เท่านั้น (กัน mismatch) */
  const [data, setData] = useState<DailyDigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [digestDialog, setDigestDialog] = useState<PersonalDigestItemDialogPayload | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const loadGenerationRef = useRef(0);

  const openDigestReminder = useCallback((item: DailyReminderItem) => {
    setDigestDialog({ type: "reminder", item });
  }, []);
  const openDigestNote = useCallback((note: DailyDigestNote) => {
    setDigestDialog({ type: "note", note });
  }, []);

  useLayoutEffect(() => {
    const cached = readCachedDigest();
    if (cached) setData(cached);
  }, []);

  const load = useCallback(async () => {
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    const gen = ++loadGenerationRef.current;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reminders?_=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        signal: ac.signal,
      });
      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const json = isJson ? ((await res.json()) as (DailyDigestResponse & { error?: string }) | null) : null;
      if (gen !== loadGenerationRef.current) return;
      if (!res.ok) {
        const fallbackError =
          res.status === 401 || res.status === 403
            ? "สิทธิ์ไม่พอหรือเซสชันหมดอายุ"
            : res.status >= 500
              ? "ระบบกำลังมีปัญหา ลองใหม่อีกครั้ง"
              : `โหลดไม่สำเร็จ (${res.status})`;
        setError(json?.error ?? fallbackError);
        return;
      }
      if (!json) {
        setError("ข้อมูลตอบกลับไม่ถูกต้อง");
        return;
      }
      setData(json);
      writeCachedDigest(json);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (gen !== loadGenerationRef.current) return;
      setError("เครือข่ายมีปัญหา");
    } finally {
      if (gen === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const showBodyLoading = loading && !data && !error;

  return (
    <>
    <PersonalAiDigestAsideFrame className={className}>
      <header className="shrink-0 p-3 pb-2">
        <div className="rounded-2xl border border-white/90 bg-white/92 px-3.5 py-3 shadow-lg shadow-indigo-950/[0.08] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2e2a58]">สรุปรายวัน</p>
              <p className="mt-0.5 text-[10px] font-medium text-[#66638c]/90">งาน · รายการ · โน้ต</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className={cn(DIGEST_BTN_SOFT, "shrink-0 px-2.5 py-1.5")}
            >
              {loading ? "…" : "รีเฟรช"}
            </button>
          </div>
          {onOpenAllNotes ? (
            <button
              type="button"
              onClick={onOpenAllNotes}
              className="app-btn-primary mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold shadow-md transition hover:opacity-95"
            >
              <span aria-hidden className="text-sm">
                📝
              </span>
              โน้ตทั้งหมด
            </button>
          ) : null}
        </div>
      </header>

      <section
        className={cn(
          "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-3 pt-0 [scrollbar-gutter:stable] transition-opacity duration-150",
          loading && data ? "opacity-90" : "opacity-100",
        )}
        aria-busy={loading && Boolean(data)}
        aria-label="รายการสรุป รายการวันนี้ และโน้ต"
      >
        {error ? (
          <p className="rounded-2xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-xs font-medium text-amber-950 shadow-sm">
            {error}
          </p>
        ) : null}

        {showBodyLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/50 py-10 text-center shadow-inner shadow-slate-900/5">
            <p className="text-xs font-medium text-slate-500">กำลังโหลด…</p>
          </div>
        ) : data ? (
          <>
            <DigestSection variant="today" title="วันนี้">
              <ReminderList
                items={data.today}
                emptyLabel="ว่าง"
                showPersonalPlanDueRow={false}
                itemCardClassName={DIGEST_VARIANT.today.itemSurface}
                onItemSelect={openDigestReminder}
              />
            </DigestSection>

            <DigestSection variant="tomorrow" title="พรุ่งนี้">
              <ReminderList
                items={data.tomorrow}
                emptyLabel="ว่าง"
                showPersonalPlanDueRow={false}
                itemCardClassName={DIGEST_VARIANT.tomorrow.itemSurface}
                onItemSelect={openDigestReminder}
              />
            </DigestSection>

            <DigestSection variant="pending" title="งานค้าง">
              <ReminderList
                items={data.pendingTodos}
                emptyLabel="ไม่มีงานค้าง"
                showPersonalPlanDueRow
                itemCardClassName={DIGEST_VARIANT.pending.itemSurface}
                onItemSelect={openDigestReminder}
              />
            </DigestSection>

            <DigestSection variant="financeEntries" title="ภาพรวมรายการวันนี้">
              <FinanceTodayEntriesOverviewPanel finance={data.financeToday} />
            </DigestSection>

            <DigestSection
              variant="notes"
              title="บันทึกล่าสุด"
              titleExtra={
                data.notes.length > 0 ? (
                  <span className="shrink-0 rounded-full bg-[#0000BF]/8 px-2 py-0.5 text-[10px] font-semibold text-[#0000BF]/70">
                    สูงสุด {NOTES_SIDEBAR_MAX}
                  </span>
                ) : null
              }
            >
              {!data.notes.length ? (
                <AppEmptyState className="rounded-xl border border-dashed border-[#0000BF]/15 bg-white/70 px-3 py-4 text-left text-[11px] leading-snug text-slate-600 shadow-inner">
                  ยังไม่มี — พิมพ์ <strong>จดว่า</strong> หรือขอช่วย <strong>วางแผน/จัดตาราง</strong> ในแชท
                </AppEmptyState>
              ) : (
                <DigestNoteCards notes={data.notes.slice(0, NOTES_SIDEBAR_MAX)} onSelect={openDigestNote} />
              )}
            </DigestSection>
          </>
        ) : null}
      </section>
    </PersonalAiDigestAsideFrame>
    <PersonalDigestItemDialog
      open={Boolean(digestDialog)}
      payload={digestDialog}
      onClose={() => setDigestDialog(null)}
      onApplied={() => {
        onNotesChanged?.();
        void load();
        setDigestDialog(null);
      }}
    />
    </>
  );
}

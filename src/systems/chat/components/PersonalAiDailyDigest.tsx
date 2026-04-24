"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppEmptyState, appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { DailyDigestResponse, DailyReminderItem } from "@/lib/reminders/daily-reminder-types";
import { formatActivityTimeThLabel } from "@/lib/reminders/activity-time-from-text";
import { formatBangkokDigestDateLabel } from "@/lib/reminders/bangkok-calendar";

const NOTES_SIDEBAR_MAX = 5;
const DIGEST_HEADLINE_MAX = 56;
const DIGEST_DETAIL_MAX = 120;
const GENERIC_NOTE_DESC = "จากบันทึกรวดเร็ว (จดว่า…)";

const DIGEST_BTN_SOFT =
  "app-btn-soft rounded-xl border border-[#dcd8f0] text-[11px] font-semibold text-[#4d47b6] shadow-sm transition hover:bg-[#f4f3ff] disabled:opacity-50";

function isGenericQuickNoteAttribution(s: string): boolean {
  const t = s.trim();
  if (t === GENERIC_NOTE_DESC) return true;
  return /จากบันทึกรวดเร็ว\s*\(จดว่า\.{1,3}\)/u.test(t);
}

/** ตัด ** และช่องว่างส่วนเกินสำหรับข้อความในแถบสรุป */
function stripDigestNoise(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** ถ้ามีแถวเวลาด้านบนแล้ว ตัดเลขเวลาซ้ำออกจากหัวข้อ */
function headlineWithoutDuplicateTime(headline: string, timeLabel: string | null): string {
  let h = stripDigestNoise(headline);
  if (!timeLabel || !h) return h;
  const hm = timeLabel.replace(/\s*น\.?$/u, "").trim();
  if (!/^\d{1,2}:\d{2}$/.test(hm)) return h;
  const re = new RegExp(`^${hm}\\s*น\\.?\\s*`, "iu");
  h = h.replace(re, "").trim();
  return h;
}

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
  finance: {
    accent: "border-l-emerald-500",
    title: "text-emerald-900",
    itemSurface: "border-emerald-100/80 bg-gradient-to-br from-emerald-50/50 to-white",
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

/** หัวข้อสั้น + รายละเอียดจาง (ตัด …) สำหรับข้อความยาว / โน้ตจากแชท */
function splitDigestText(body: string | null | undefined): { headline: string; detail: string | null } {
  const raw = String(body ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!raw) return { headline: "", detail: null };

  const reqBlock =
    raw.match(/คำขอ:\s*([\s\S]*?)(?:\r?\n\s*-{3,}|\r?\n\r?\n\s*-{3,})/u) ??
    raw.match(/คำขอ:\s*([\s\S]*?)\s+-{3,}\s+/u);
  if (reqBlock?.[1]) {
    const head = reqBlock[1].replace(/\s+/g, " ").trim();
    const headline =
      head.length > DIGEST_HEADLINE_MAX ? `${head.slice(0, DIGEST_HEADLINE_MAX)}…` : head;
    const dashIdx = raw.search(/\s+-{3,}\s+/u);
    let tail =
      dashIdx >= 0
        ? raw
            .slice(dashIdx)
            .replace(/^\s*-{3,}\s*/u, "")
            .trim()
        : "";
    tail = tail.replace(/\s+/g, " ").trim();
    const detailRaw =
      tail.length > DIGEST_DETAIL_MAX ? `${tail.slice(0, DIGEST_DETAIL_MAX).trim()}…` : tail.length ? tail : null;
    const detail = detailRaw ? stripDigestNoise(detailRaw) : null;
    return { headline: stripDigestNoise(headline), detail };
  }

  if (raw.includes("\n")) {
    let lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines[0] && /^แผนงานจากแชท AI$/u.test(lines[0])) {
      lines = lines.slice(1);
    }
    lines = lines.filter((l) => !isGenericQuickNoteAttribution(l));
    const first = lines[0] ?? "";
    const headlineRaw =
      first.length > DIGEST_HEADLINE_MAX ? `${first.slice(0, DIGEST_HEADLINE_MAX)}…` : first;
    const headline = stripDigestNoise(headlineRaw);
    const rest = stripDigestNoise(lines.slice(1).join(" ").trim());
    const detailRaw =
      rest.length > DIGEST_DETAIL_MAX ? `${rest.slice(0, DIGEST_DETAIL_MAX).trim()}…` : rest.length ? rest : null;
    const detail = detailRaw ? stripDigestNoise(detailRaw) : null;
    return { headline, detail };
  }

  const single = stripDigestNoise(raw.replace(/\s+/g, " ").trim());
  if (single.length <= DIGEST_HEADLINE_MAX) return { headline: single, detail: null };
  return {
    headline: `${single.slice(0, DIGEST_HEADLINE_MAX)}…`,
    detail: stripDigestNoise(`${single.slice(DIGEST_HEADLINE_MAX).trim()}…`),
  };
}

function digestReminderDisplay(item: DailyReminderItem): { headline: string; detail: string | null } {
  const titleSafe = String(item.title ?? "");
  if (item.source === "personal_note") {
    return splitDigestText(titleSafe);
  }
  const desc = String(item.description ?? "").trim();
  if (desc && !isGenericQuickNoteAttribution(desc)) {
    const th = titleSafe.trim();
    const headline =
      th.length > DIGEST_HEADLINE_MAX ? `${th.slice(0, DIGEST_HEADLINE_MAX)}…` : th;
    const detail = desc.length > DIGEST_DETAIL_MAX ? `${desc.slice(0, DIGEST_DETAIL_MAX)}…` : desc;
    return { headline, detail };
  }
  return splitDigestText(titleSafe);
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
  /** เน้นหัวข้อหมวด (เช่น บัญชีวันนี้) ให้แยกจากเนื้อหาด้านล่าง */
  titleClassName?: string;
  /** ปรับพื้น body รายหมวด */
  bodyClassName?: string;
  children: ReactNode;
}) {
  const v = DIGEST_VARIANT[variant];
  return (
    <section className={cn(DIGEST_SECTION_SHELL, "border-l-[3px]", v.accent)}>
      <div className={DIGEST_SECTION_HEAD}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full ring-2 ring-white shadow-sm", {
                "bg-[#6366f1]": variant === "today",
                "bg-[#4f46e5]": variant === "tomorrow",
                "bg-amber-500": variant === "pending",
                "bg-emerald-500": variant === "finance",
                "bg-[#0000BF]": variant === "notes",
              })}
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
}: {
  item: DailyReminderItem;
  showPersonalPlanDueRow?: boolean;
  /** ถ้ามี แสดงเป็นการ์ดแยกรายการ (เช่น วันนี้ / พรุ่งนี้) */
  cardClassName?: string;
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

  return (
    <li className={cn(DIGEST_ITEM_CARD, surface)}>
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
    </li>
  );
}

function ReminderList({
  items,
  emptyLabel,
  showPersonalPlanDueRow,
  itemCardClassName,
}: {
  items: DailyReminderItem[];
  emptyLabel: string;
  showPersonalPlanDueRow?: boolean;
  itemCardClassName?: string;
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
        />
      ))}
    </ul>
  );
}

export function PersonalAiDailyDigest({
  className,
  /** เพิ่มค่าทุกครั้งหลังแชทสำเร็จ เพื่อดึงบันทึก/ตารางใหม่ */
  refreshKey,
  onOpenAllNotes,
}: {
  className?: string;
  refreshKey?: number;
  onOpenAllNotes?: () => void;
}) {
  const [hasMounted, setHasMounted] = useState(false);
  const [data, setData] = useState<DailyDigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reminders?_=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await res.json()) as DailyDigestResponse & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "โหลดไม่สำเร็จ");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("เครือข่ายมีปัญหา");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    void load();
  }, [hasMounted, load, refreshKey]);

  const showBodyLoading = !hasMounted || (loading && !data && !error);

  return (
    <aside
      id="personal-ai-digest"
      className={cn(
        "flex max-h-[min(52vh,28rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#dcd7f0] bg-gradient-to-b from-[#faf9ff] via-[#f3f1fc] to-[#e8e4f7] shadow-xl shadow-indigo-950/[0.09] ring-1 ring-white/70 lg:h-full lg:max-h-none lg:min-h-0 lg:w-72 lg:min-w-[18rem] xl:w-80",
        className,
      )}
    >
      <div className="shrink-0 p-3 pb-2">
        <div className="rounded-2xl border border-white/90 bg-white/92 px-3.5 py-3 shadow-lg shadow-indigo-950/[0.08] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2e2a58]">สรุปรายวัน</p>
              <p className="mt-0.5 text-[10px] font-medium text-[#66638c]/90">งาน · บัญชี · โน้ต</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={!hasMounted || loading}
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
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-3 pt-0">
        {hasMounted && error ? (
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
              />
            </DigestSection>

            <DigestSection variant="tomorrow" title="พรุ่งนี้">
              <ReminderList
                items={data.tomorrow}
                emptyLabel="ว่าง"
                showPersonalPlanDueRow={false}
                itemCardClassName={DIGEST_VARIANT.tomorrow.itemSurface}
              />
            </DigestSection>

            <DigestSection variant="pending" title="งานค้าง">
              <ReminderList
                items={data.pendingTodos}
                emptyLabel="ไม่มีงานค้าง"
                showPersonalPlanDueRow
                itemCardClassName={DIGEST_VARIANT.pending.itemSurface}
              />
            </DigestSection>

            <DigestSection
              variant="finance"
              title="บัญชีวันนี้"
              titleClassName="!text-[14px] !font-bold !tracking-tight !text-emerald-950"
              bodyClassName="border-t border-emerald-100/60 bg-gradient-to-b from-emerald-50/35 via-[#faf9ff]/50 to-[#f8f7fd]/30 pt-3.5"
            >
              <div className="flex flex-col gap-4">
                {data.financeToday.available ? (
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800/75">
                        สรุปวันนี้
                      </p>
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-white to-rose-50/50 px-4 py-3.5 text-sm text-slate-800 shadow-md shadow-emerald-900/[0.06]">
                        <div className="min-w-0 text-left">
                          <span className="text-[11px] font-medium text-slate-500">รับ</span>
                          <span className="ml-1.5 text-base font-bold tabular-nums text-emerald-700">
                            {formatBaht(data.financeToday.incomeBaht)}
                          </span>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <span className="text-[11px] font-medium text-slate-500">จ่าย</span>
                          <span className="ml-1.5 text-base font-bold tabular-nums text-rose-700">
                            {formatBaht(data.financeToday.expenseBaht)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {(data.financeToday.entries ?? []).length > 0 ? (
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          รายการ
                        </p>
                        <ul className="m-0 list-none space-y-3 p-0">
                          {(data.financeToday.entries ?? []).map((e) => {
                            const financeActivity = formatActivityTimeThLabel(`${e.title} ${e.categoryLabel}`);
                            return (
                              <li
                                key={e.id}
                                className={cn(
                                  DIGEST_ITEM_CARD,
                                  DIGEST_VARIANT.finance.itemSurface,
                                  "border-slate-200/90 px-3.5 py-3 shadow-sm",
                                )}
                              >
                                <div className="flex min-w-0 flex-col gap-1.5">
                                  {financeActivity ? (
                                    <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200/70 bg-white/90 px-1.5 py-px font-mono text-[9px] font-medium tabular-nums text-slate-500">
                                      {financeActivity}
                                    </span>
                                  ) : null}
                                  <div
                                    className={cn(
                                      "text-[15px] font-bold tabular-nums leading-none tracking-tight",
                                      e.type === "INCOME" ? "text-emerald-700" : "text-rose-700",
                                    )}
                                  >
                                    {e.type === "INCOME" ? "+" : "−"}
                                    {formatBaht(e.amountBaht)}
                                  </div>
                                  <p className="min-w-0 break-words text-[10px] font-normal leading-relaxed text-slate-600">
                                    {e.title}
                                  </p>
                                  {e.categoryLabel && e.categoryLabel !== "อื่นๆ" ? (
                                    <p className="line-clamp-1 text-[9px] font-normal leading-normal text-slate-400">
                                      {e.categoryLabel}
                                    </p>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200/90 bg-white/60 px-3 py-4 text-center text-[11px] leading-relaxed text-slate-500 shadow-inner">
                        ยังไม่มีรายการ
                      </p>
                    )}
                  </div>
                ) : (
                  <AppEmptyState className="rounded-xl border border-dashed border-slate-200/90 bg-white/60 px-3 py-5 text-center text-[11px] leading-relaxed shadow-inner">
                    ไม่มีสิทธิ์บัญชี
                  </AppEmptyState>
                )}
                <Link
                  href="/dashboard/home-finance"
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "flex w-full items-center justify-center py-3 text-xs font-semibold",
                  )}
                >
                  บัญชี
                </Link>
              </div>
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
                <ul className="m-0 list-none space-y-2 p-0">
                  {data.notes.slice(0, NOTES_SIDEBAR_MAX).map((n) => {
                    const noteActivity = formatActivityTimeThLabel(n.content);
                    let { headline, detail } = splitDigestText(n.content);
                    headline = headlineWithoutDuplicateTime(headline, noteActivity);
                    if (!headline.trim()) {
                      headline = stripDigestNoise(String(n.content ?? "").slice(0, DIGEST_HEADLINE_MAX));
                    }
                    return (
                      <li key={n.id} className={cn(DIGEST_ITEM_CARD, DIGEST_VARIANT.notes.itemSurface)}>
                        <div className="flex min-w-0 flex-col gap-1.5">
                          {noteActivity ? (
                            <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200/80 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-slate-700">
                              {noteActivity}
                            </span>
                          ) : null}
                          <p className="break-words text-[13px] font-medium leading-snug text-slate-900">{headline}</p>
                          {detail ? (
                            <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{detail}</p>
                          ) : null}
                          <p className="text-[10px] text-slate-500">{formatBangkokDigestDateLabel(n.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </DigestSection>
          </>
        ) : null}
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap, RefreshCw, Scale, Users } from "lucide-react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  LMS_DASHBOARD_TAB_ITEMS,
  lmsDashboardHref,
  parseLmsDashboardTab,
  type LmsDashboardTabKey,
} from "@/systems/lms/lms-module-nav";
import { LmsPageSubNav } from "@/systems/lms/components/LmsPageSubNav";
import { LmsPurchasesPanel } from "@/systems/lms/components/LmsPurchasesPanel";
import {
  LMS_ENROLLMENT_STATUS_LABELS,
  type LmsProfileDto,
} from "@/systems/lms/lib/mappers";
import {
  lmsDashboardTabIcon,
  lmsPageTitleIcon,
  lmsPageTitleTone,
} from "@/systems/lms/lib/page-menu-icons";
import {
  lmsDashboardStatsGridClass,
  lmsFilterChipClass,
  lmsFilterChipShellClass,
  lmsIconButtonClass,
  lmsOutlineButtonClass,
  lmsSectionHeadingClass,
  lmsStatInlineClass,
} from "@/systems/lms/lib/ui-tokens";

const DASHBOARD_TAB_ITEMS = LMS_DASHBOARD_TAB_ITEMS.map((item) => ({
  ...item,
  icon: lmsDashboardTabIcon(item.key),
}));

const PROGRESS_PAGE_SIZE = 8;

type ProgressFilter = "all" | "learning" | "completed";

type Stats = {
  courseCount: number;
  learnerCount: number;
  enrollmentCount: number;
  completionRate: number;
  avgProgress: number;
  income: number;
  expense: number;
  balance: number;
};

type ProgressRow = {
  id: string;
  progressPercent: number;
  status: keyof typeof LMS_ENROLLMENT_STATUS_LABELS;
  updatedAt: string;
  learnerName: string;
  learnerUsername: string;
  courseTitle: string;
};

const STAT_ACCENTS = {
  sky: "border-l-sky-500 text-sky-800",
  violet: "border-l-violet-500 text-violet-800",
  emerald: "border-l-emerald-500 text-emerald-800",
  slate: "border-l-slate-400 text-slate-700",
  rose: "border-l-rose-500 text-rose-800",
} as const;

function LmsStatCard({
  title,
  hint,
  value,
  tone,
  icon,
  valueClassName,
}: {
  title: string;
  hint?: string;
  value: string;
  tone: keyof typeof STAT_ACCENTS;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className={cn(lmsStatInlineClass, "border-l-[3px]", STAT_ACCENTS[tone])}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
        <span className="text-current" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      <p className={cn("text-lg font-black tabular-nums sm:text-xl", valueClassName)}>{value}</p>
      {hint ? <p className="text-[10px] font-semibold leading-tight text-[#66638c]/90">{hint}</p> : null}
    </div>
  );
}

function progressBarTone(pct: number, status: ProgressRow["status"]): string {
  if (status === "COMPLETED" || pct >= 100) return "bg-emerald-500";
  if (pct >= 50) return "bg-[#5b61ff]";
  if (pct > 0) return "bg-amber-500";
  return "bg-slate-300";
}

function isLearningStatus(status: ProgressRow["status"]): boolean {
  return status === "ENROLLED" || status === "IN_PROGRESS";
}

export function LmsDashboardClient({ initialProfile }: { initialProfile: LmsProfileDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseLmsDashboardTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const [stats, setStats] = useState<Stats | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [progressPage, setProgressPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const purchasesRefreshRef = useRef<(() => void) | null>(null);
  const onPurchasesRefreshReady = useCallback((fn: () => void) => {
    purchasesRefreshRef.current = fn;
  }, []);

  const setTab = useCallback(
    (next: string) => {
      router.replace(lmsDashboardHref(next as LmsDashboardTabKey), { scroll: false });
    },
    [router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lms/session/summary");
      const data = (await res.json()) as {
        stats?: Stats;
        progress?: ProgressRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setStats(data.stats ?? null);
      setProgress(data.progress ?? []);
      setProgressPage(0);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice.error]);

  useEffect(() => {
    if (tab === "overview") void load();
  }, [load, tab]);

  const s = stats ?? {
    courseCount: 0,
    learnerCount: 0,
    enrollmentCount: 0,
    completionRate: 0,
    avgProgress: 0,
    income: 0,
    expense: 0,
    balance: 0,
  };

  const progressCounts = useMemo(() => {
    let learning = 0;
    let completed = 0;
    for (const row of progress) {
      if (row.status === "COMPLETED") completed += 1;
      else if (isLearningStatus(row.status)) learning += 1;
    }
    return { all: progress.length, learning, completed };
  }, [progress]);

  const filteredProgress = useMemo(() => {
    if (progressFilter === "completed") {
      return progress.filter((row) => row.status === "COMPLETED");
    }
    if (progressFilter === "learning") {
      return progress.filter((row) => isLearningStatus(row.status));
    }
    return progress;
  }, [progress, progressFilter]);

  const progressPageCount = Math.max(1, Math.ceil(filteredProgress.length / PROGRESS_PAGE_SIZE));
  const safeProgressPage = Math.min(progressPage, progressPageCount - 1);
  const pagedProgress = useMemo(() => {
    const start = safeProgressPage * PROGRESS_PAGE_SIZE;
    return filteredProgress.slice(start, start + PROGRESS_PAGE_SIZE);
  }, [filteredProgress, safeProgressPage]);

  const setProgressFilterAndReset = useCallback((next: ProgressFilter) => {
    setProgressFilter(next);
    setProgressPage(0);
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      {notice.popup}
      <LmsPageSubNav
        title="แดชบอร์ด"
        titleIcon={lmsPageTitleIcon("dashboard")}
        titleTone={lmsPageTitleTone("dashboard")}
        subtitle={initialProfile.displayName}
        items={DASHBOARD_TAB_ITEMS}
        activeKey={tab}
        onSelect={setTab}
        ariaLabel="เมนูย่อยแดชบอร์ด"
        action={
          <button
            type="button"
            className={lmsIconButtonClass}
            onClick={() => {
              if (tab === "overview") void load();
              purchasesRefreshRef.current?.();
            }}
            disabled={tab === "overview" && loading}
            aria-label={loading ? "กำลังรีเฟรช" : "รีเฟรชข้อมูล"}
            title="รีเฟรช"
            aria-busy={tab === "overview" && loading}
          >
            <RefreshCw
              className={cn("h-4 w-4", tab === "overview" && loading && "animate-spin")}
              aria-hidden
            />
          </button>
        }
      >
        {tab === "purchases" ? (
          <div className="space-y-3">
            <h3 className={lmsSectionHeadingClass}>คำขอซื้อ</h3>
            <p className="text-xs text-[#66638c]">
              ทุกรายการ — รออนุมัติ · ยืนยันแล้ว · ปฏิเสธ (ค้นหาย้อนหลังได้)
            </p>
            <LmsPurchasesPanel mode="all" onRefreshReady={onPurchasesRefreshReady} />
          </div>
        ) : (
          <>
            <ul className={cn(lmsDashboardStatsGridClass, "mb-4")} aria-label="สรุปสถาบัน">
              <li>
                <LmsStatCard
                  title="คอร์ส"
                  value={s.courseCount.toLocaleString("th-TH")}
                  tone="sky"
                  icon={<BookOpen className="h-3.5 w-3.5" />}
                  valueClassName="text-[#1e1b4b]"
                />
              </li>
              <li>
                <LmsStatCard
                  title="ผู้เรียน"
                  value={s.learnerCount.toLocaleString("th-TH")}
                  tone="violet"
                  icon={<Users className="h-3.5 w-3.5" />}
                  valueClassName="text-[#1e1b4b]"
                />
              </li>
              <li>
                <LmsStatCard
                  title="อัตราจบคอร์ส"
                  value={`${s.completionRate}%`}
                  tone="emerald"
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                  valueClassName="text-emerald-700"
                />
              </li>
              <li>
                <LmsStatCard
                  title="ยอดคงเหลือ"
                  hint={`รายรับ ฿${s.income.toLocaleString("th-TH")} − รายจ่าย ฿${s.expense.toLocaleString("th-TH")}`}
                  value={`฿${s.balance.toLocaleString("th-TH")}`}
                  tone={s.balance >= 0 ? "slate" : "rose"}
                  icon={<Scale className="h-3.5 w-3.5" />}
                  valueClassName={s.balance >= 0 ? "text-[#1e1b4b]" : "text-rose-800"}
                />
              </li>
            </ul>

            <div className="mb-4 space-y-3">
              <LmsPurchasesPanel
                mode="pending"
                hideFilter
                title="รออนุมัติสลิป"
                onRefreshReady={onPurchasesRefreshReady}
              />
            </div>

            <section className="space-y-3" aria-labelledby="lms-learner-progress-heading">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 id="lms-learner-progress-heading" className={lmsSectionHeadingClass}>
                    ความคืบหน้าผู้เรียน
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                    อัปเดตล่าสุด · ค่าเฉลี่ย {s.avgProgress}% จาก {s.enrollmentCount.toLocaleString("th-TH")}{" "}
                    การลงทะเบียน
                  </p>
                </div>
                {filteredProgress.length > 0 ? (
                  <p className="text-xs font-bold tabular-nums text-[#66638c]">
                    แสดง {pagedProgress.length}/{filteredProgress.length}
                  </p>
                ) : null}
              </div>

              <div
                className={lmsFilterChipShellClass}
                role="tablist"
                aria-label="กรองความคืบหน้าผู้เรียน"
              >
                {(
                  [
                    { key: "all" as const, label: "ทั้งหมด", count: progressCounts.all },
                    { key: "learning" as const, label: "กำลังเรียน", count: progressCounts.learning },
                    { key: "completed" as const, label: "จบแล้ว", count: progressCounts.completed },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="tab"
                    aria-selected={progressFilter === opt.key}
                    className={lmsFilterChipClass(progressFilter === opt.key)}
                    onClick={() => setProgressFilterAndReset(opt.key)}
                  >
                    {opt.label} ({opt.count})
                  </button>
                ))}
              </div>

              {loading && progress.length === 0 ? (
                <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
              ) : progress.length === 0 ? (
                <AppEmptyState>
                  ยังไม่มีการลงทะเบียนเรียน — เพิ่มผู้เรียนและลงทะเบียนคอร์สที่เมนูจัดการ
                </AppEmptyState>
              ) : filteredProgress.length === 0 ? (
                <AppEmptyState>
                  {progressFilter === "completed"
                    ? "ยังไม่มีผู้เรียนที่จบคอร์ส"
                    : "ยังไม่มีผู้เรียนที่กำลังเรียน"}
                </AppEmptyState>
              ) : (
                <>
                  <ul className="space-y-2">
                    {pagedProgress.map((row) => {
                      const pct = Math.min(100, Math.max(0, row.progressPercent));
                      return (
                        <li
                          key={row.id}
                          className={cn(
                            "rounded-lg border border-slate-200/90 border-l-[3px] px-3 py-2.5 sm:px-4",
                            row.status === "COMPLETED"
                              ? "border-l-emerald-500 bg-emerald-50/40"
                              : "border-l-violet-400 bg-violet-50/40",
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-[#1e1b4b]">{row.learnerName}</p>
                              <p className="truncate text-xs font-semibold text-[#66638c]">
                                {row.courseTitle} ·{" "}
                                {LMS_ENROLLMENT_STATUS_LABELS[row.status] ?? row.status}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-black tabular-nums text-[#4d47b6]">
                              {pct}%
                            </p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/80">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                progressBarTone(pct, row.status),
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {progressPageCount > 1 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-xs font-semibold text-[#66638c]">
                        หน้า {safeProgressPage + 1}/{progressPageCount}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className={lmsOutlineButtonClass}
                          disabled={safeProgressPage <= 0}
                          onClick={() => setProgressPage((p) => Math.max(0, p - 1))}
                          aria-label="หน้าก่อนหน้า"
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          type="button"
                          className={lmsOutlineButtonClass}
                          disabled={safeProgressPage >= progressPageCount - 1}
                          onClick={() =>
                            setProgressPage((p) => Math.min(progressPageCount - 1, p + 1))
                          }
                          aria-label="หน้าถัดไป"
                        >
                          ถัดไป
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </>
        )}
      </LmsPageSubNav>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap, RefreshCw, Scale, Users } from "lucide-react";
import {
  AppColumnBarSparkChart,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  LMS_DASHBOARD_TAB_ITEMS,
  lmsDashboardHref,
  parseLmsDashboardTab,
  type LmsDashboardTabKey,
} from "@/systems/lms/lms-module-nav";
import { LmsPageSubNav } from "@/systems/lms/components/LmsPageSubNav";
import { LmsPurchasesPanel } from "@/systems/lms/components/LmsPurchasesPanel";
import type { LmsProfileDto } from "@/systems/lms/lib/mappers";
import {
  lmsDashboardStatsGridClass,
  lmsIconButtonClass,
  lmsSectionHeadingClass,
  lmsStatInlineClass,
} from "@/systems/lms/lib/ui-tokens";

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

export function LmsDashboardClient({ initialProfile }: { initialProfile: LmsProfileDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseLmsDashboardTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const [stats, setStats] = useState<Stats | null>(null);
  const [spark, setSpark] = useState<{ date: string; income: number; expense: number }[]>([]);
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
      const data = (await res.json()) as { stats?: Stats; spark?: typeof spark; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setStats(data.stats ?? null);
      setSpark(data.spark ?? []);
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

  const maxIncome = Math.max(1, ...spark.map((d) => d.income));
  const buckets = spark.map((d) => ({
    key: d.date,
    label: d.date.slice(5),
    amount: d.income,
    pct: Math.round((d.income / maxIncome) * 100),
  }));

  return (
    <div className="min-w-0 space-y-4">
      {notice.popup}
      <LmsPageSubNav
        title="แดชบอร์ด"
        subtitle={initialProfile.displayName}
        items={LMS_DASHBOARD_TAB_ITEMS}
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

            <AppColumnBarSparkChart
              title="แนวโน้มรายรับรายวัน"
              compact
              variant="brand"
              className="flex min-h-0 flex-1 flex-col"
              emptyText="ยังไม่มีข้อมูลการเงิน — เพิ่มรายรับ–รายจ่ายที่เมนูการเงิน"
              buckets={buckets}
            />
          </>
        )}
      </LmsPageSubNav>
    </div>
  );
}

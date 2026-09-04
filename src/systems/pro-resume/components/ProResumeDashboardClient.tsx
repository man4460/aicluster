"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, MousePointerClick, RefreshCw, TrendingUp } from "lucide-react";
import { AppColumnBarSparkChart, useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ProResumePagePanel } from "@/systems/pro-resume/components/ProResumePagePanel";
import { proResumePageTitleIcon, proResumePageTitleTone } from "@/systems/pro-resume/lib/page-menu-icons";
import type { ResumeProfileDto } from "@/systems/pro-resume/lib/mappers";
import {
  proResumeDashboardOverviewGridClass,
  proResumeIconButtonClass,
  proResumeStatInlineClass,
  proResumeStatsGridClass,
} from "@/systems/pro-resume/lib/ui-tokens";

type Analytics = {
  viewsThisWeek: number;
  weekStart: string;
  viewsByDay: { dateKey: string; count: number }[];
  topPortfolioItems: { id: string; title: string; clickCount: number; coverImage: string | null }[];
  isPremium: boolean;
};

export function ProResumeDashboardClient({
  initialProfile,
  hasMonthly,
}: {
  initialProfile: ResumeProfileDto;
  hasMonthly: boolean;
}) {
  const notice = useAppNoticePopup();
  const [profile] = useState(initialProfile);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pro-resume/session/analytics");
      const data = (await res.json()) as Analytics & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setAnalytics(data);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartBuckets =
    analytics?.viewsByDay.map((d) => {
      const amount = d.count;
      const max = Math.max(1, ...(analytics.viewsByDay.map((x) => x.count) || [1]));
      return {
        key: d.dateKey,
        label: d.dateKey.slice(5),
        amount,
        pct: Math.round((amount / max) * 100),
      };
    }) ?? [];

  return (
    <>
      {notice.popup}
      <ProResumePagePanel
        title="แดชบอร์ด"
        titleIcon={proResumePageTitleIcon("dashboard")}
        titleTone={proResumePageTitleTone("dashboard")}
        subtitle={`โปรไฟล์: ${profile.fullName}`}
        action={
          <button
            type="button"
            className={cn(proResumeIconButtonClass, loading && "opacity-60")}
            aria-label="รีเฟรชข้อมูลรายงาน"
            title="รีเฟรช"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
          </button>
        }
      >
        <div className={proResumeDashboardOverviewGridClass}>
          <div className="flex min-w-0 flex-col">
            <h3 className="text-xs font-semibold text-[#2e2a58]">สรุปสัปดาห์นี้</h3>
            <div className={cn(proResumeStatsGridClass, "mt-2")}>
              <div className={proResumeStatInlineClass}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                  <Eye className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                  เข้าชมสัปดาห์นี้
                </span>
                <p className="text-xl font-black tabular-nums text-[#1e1b4b]">
                  {loading ? "—" : (analytics?.viewsThisWeek ?? 0).toLocaleString("th-TH")}
                </p>
              </div>
              <div className={proResumeStatInlineClass}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                  เริ่มสัปดาห์
                </span>
                <p className="text-sm font-bold text-[#1e1b4b]">{analytics?.weekStart ?? "—"}</p>
              </div>
            </div>
          </div>

          <AppColumnBarSparkChart
            title="การเข้าชม 30 วันล่าสุด (เวลาไทย)"
            buckets={chartBuckets}
            emptyText="ยังไม่มีข้อมูลการเข้าชม"
            variant="brand"
            compact
            evenDistribution
            className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
          />
        </div>

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#1e1b4b]">
            <MousePointerClick className="h-4 w-4 text-emerald-600" aria-hidden />
            ผลงานที่ถูกคลิกมากสุด
            {!hasMonthly ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
                แพ็กรายเดือน
              </span>
            ) : null}
          </h3>
          {loading ? (
            <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : analytics?.topPortfolioItems.length ? (
            <ul className="space-y-2">
              {analytics.topPortfolioItems.map((item, i) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-[#4d47b6] ring-1 ring-slate-200">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-semibold text-[#1e1b4b]">{item.title}</span>
                  </div>
                  <span className="shrink-0 text-sm font-black tabular-nums text-emerald-700">
                    {item.clickCount} คลิก
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#66638c]">ยังไม่มีการคลิกผลงาน</p>
          )}
        </div>
      </ProResumePagePanel>
    </>
  );
}

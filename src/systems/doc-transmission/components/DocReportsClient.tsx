"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppCompareBarList,
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DocStatCard } from "@/systems/doc-transmission/components/DocStatCard";
import { docFieldClass, docListRowCardClass } from "@/systems/doc-transmission/doc-ui-tokens";
import {
  DOC_CATEGORY_BY_KEY,
  DOC_CATEGORY_LIST,
  DOC_PRIORITY_BY_KEY,
  DOC_STATUS_BY_KEY,
  DOC_PRIORITY_LIST,
  DOC_STATUS_LIST,
} from "@/systems/doc-transmission/lib/doc-types";

type Overview = {
  totalAll: number;
  withAttachment: number;
  sharedCount: number;
  byCategory: Array<{ category: keyof typeof DOC_CATEGORY_BY_KEY; count: number }>;
  byStatus: Array<{ status: keyof typeof DOC_STATUS_BY_KEY; count: number }>;
  byPriority: Array<{ priority: keyof typeof DOC_PRIORITY_BY_KEY; count: number }>;
  daily: Array<{ date: string; count: number }>;
};

const inputClass = docFieldClass;

export function DocReportsClient() {
  const [filterYear, setFilterYear] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.set("year", filterYear);
      const res = await fetch(
        `/api/doc-transmission/reports/overview${params.toString() ? `?${params.toString()}` : ""}`,
      );
      const json = (await res.json().catch(() => null)) as Overview | { error?: string } | null;
      if (!res.ok) throw new Error((json as { error?: string } | null)?.error ?? "โหลดข้อมูลไม่สำเร็จ");
      setData(json as Overview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterYear) params.set("year", filterYear);
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("dateFrom", filterFrom);
    if (filterTo) params.set("dateTo", filterTo);
    window.open(`/api/doc-transmission/reports/export?${params.toString()}`, "_blank");
  }

  const categoryRows = (data?.byCategory ?? []).map((c) => {
    const cfg = DOC_CATEGORY_BY_KEY[c.category];
    const max = Math.max(...(data?.byCategory.map((x) => x.count) ?? [1]), 1);
    return {
      key: `cat-${c.category}`,
      label: `${cfg.title} · ${c.count} ฉบับ`,
      amount: c.count,
      pct: max > 0 ? (c.count / max) * 100 : 0,
    };
  });

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="รายงานสารบรรณ"
          description="ภาพรวมจำนวนเอกสาร · สถานะ · ความเร่งด่วน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              aria-label="รีเฟรชข้อมูลรายงาน"
              onClick={() => void fetchData()}
              disabled={loading}
              className="app-btn-soft inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/55 bg-white/75 px-2.5 text-[#5b61ff] hover:bg-white/90 sm:min-w-0 sm:px-4"
            >
              <IconRefresh className={cn("h-5 w-5", loading && "animate-spin", "sm:mr-1.5")} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          <input
            type="text"
            placeholder="ปี (เช่น 2567)"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={inputClass}
            maxLength={4}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={inputClass}
          >
            <option value="">หมวดทั้งหมด</option>
            {DOC_CATEGORY_LIST.map((c) => (
              <option key={c.key} value={c.key}>
                {c.title}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputClass}
          >
            <option value="">สถานะทั้งหมด</option>
            {DOC_STATUS_LIST.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className={inputClass}
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={exportCsv}
            className="col-span-2 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 sm:col-span-1"
          >
            ดาวน์โหลด CSV
          </button>
        </div>
      </AppDashboardSection>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <AppDashboardSection tone="slate">
          <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        </AppDashboardSection>
      ) : data ? (
        <>
          <AppDashboardSection tone="slate">
            <AppSectionHeader tone="slate" title="ภาพรวม" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DocStatCard title="ทั้งหมด" value={data.totalAll.toLocaleString("th-TH")} subtitle="ฉบับ" tone="violet" />
              <DocStatCard
                title="มีไฟล์แนบ"
                value={data.withAttachment.toLocaleString("th-TH")}
                subtitle="ฉบับ"
                tone="emerald"
              />
              <DocStatCard
                title="แชร์สาธารณะ"
                value={data.sharedCount.toLocaleString("th-TH")}
                subtitle="ฉบับ"
                tone="amber"
              />
              <DocStatCard
                title="ดำเนินการ"
                value={(data.byStatus.find((s) => s.status === "IN_PROGRESS")?.count ?? 0).toLocaleString("th-TH")}
                subtitle="ฉบับ"
                tone="indigo"
              />
            </div>
          </AppDashboardSection>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AppDashboardSection tone="slate">
              <AppSectionHeader tone="slate" title="แยกตามหมวด" />
              <AppCompareBarList
                title="หมวดเอกสาร"
                rows={categoryRows}
                emptyText="ยังไม่มีข้อมูล"
              />
            </AppDashboardSection>

            <AppDashboardSection tone="slate">
              <AppSectionHeader tone="slate" title="แยกตามสถานะ" />
              {data.byStatus.length === 0 ? (
                <AppEmptyState>ยังไม่มีข้อมูล</AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {data.byStatus.map((s) => {
                    const cfg = DOC_STATUS_BY_KEY[s.status];
                    return (
                      <li
                        key={s.status}
                        className={cn(docListRowCardClass, "flex items-center justify-between px-3 py-2")}
                      >
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold ring-1", cfg.badge)}>
                          {cfg.label}
                        </span>
                        <span className="font-bold text-[#2e2a58]">{s.count.toLocaleString("th-TH")}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AppDashboardSection>

            <AppDashboardSection tone="slate">
              <AppSectionHeader tone="slate" title="แยกตามความเร่งด่วน" />
              {data.byPriority.length === 0 ? (
                <AppEmptyState>ยังไม่มีข้อมูล</AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {data.byPriority.map((p) => {
                    const cfg = DOC_PRIORITY_BY_KEY[p.priority];
                    return (
                      <li
                        key={p.priority}
                        className={cn(docListRowCardClass, "flex items-center justify-between px-3 py-2")}
                      >
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold ring-1", cfg.tone)}>
                          {cfg.label}
                        </span>
                        <span className="font-bold text-[#2e2a58]">{p.count.toLocaleString("th-TH")}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AppDashboardSection>
          </div>
        </>
      ) : null}
    </div>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

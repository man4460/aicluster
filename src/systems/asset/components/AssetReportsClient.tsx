"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppCompareBarList,
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  type AppCompareBarRow,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { AssetStatCard } from "@/systems/asset/components/AssetStatCard";
import { formatTHB } from "@/systems/asset/lib/asset-types";

type ReportPayload = {
  totalAssets: number;
  totalPurchase: number;
  totalCurrent: number;
  depreciation: number;
  byCategory: Array<{ id: number | null; name: string; count: number; purchase: number; current: number }>;
  byDepartment: Array<{ id: number | null; name: string; count: number; purchase: number; current: number }>;
};

const EXPORTS = [
  { kind: "assets", label: "ทรัพย์สินทั้งหมด" },
  { kind: "transactions", label: "เคลื่อนไหว" },
  { kind: "maintenance", label: "ซ่อมบำรุง" },
  { kind: "disposals", label: "จำหน่ายออก" },
  { kind: "audits", label: "ตรวจนับ" },
] as const;

export function AssetReportsClient() {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/asset/reports/overview", { cache: "no-store" });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error ?? "โหลดรายงานไม่สำเร็จ");
      }
      const j: ReportPayload = await r.json();
      setData(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadCsv = (kind: string) => {
    window.open(`/api/asset/reports/export?kind=${encodeURIComponent(kind)}`, "_blank");
  };

  const cats = data?.byCategory ?? [];
  const deps = data?.byDepartment ?? [];
  const catMax = cats[0]?.purchase ?? 0;
  const depMax = deps[0]?.purchase ?? 0;
  const categoryRows: AppCompareBarRow[] = cats.map((c) => ({
    key: `cat-${c.id ?? "none"}`,
    label: `${c.name} · ${c.count} รายการ`,
    amount: c.purchase,
    pct: catMax > 0 ? (c.purchase / catMax) * 100 : 0,
  }));
  const departmentRows: AppCompareBarRow[] = deps.map((d) => ({
    key: `dep-${d.id ?? "none"}`,
    label: `${d.name} · ${d.count} รายการ`,
    amount: d.purchase,
    pct: depMax > 0 ? (d.purchase / depMax) * 100 : 0,
  }));

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ภาพรวมทรัพย์สิน"
          description="มูลค่าทรัพย์สินตามหมวดหมู่และแผนก พร้อมการเสื่อมราคารวม"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              aria-label="รีเฟรชข้อมูลรายงาน"
              aria-busy={loading}
              className={cn(
                "app-btn-soft inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/55 bg-white/75 px-2.5 py-2 text-sm font-semibold text-[#5b61ff] hover:bg-white/90 sm:min-h-0 sm:min-w-0 sm:px-3.5",
                loading && "pointer-events-none opacity-60",
              )}
            >
              <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-1.5", loading && "animate-spin")} aria-hidden />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          }
        />

        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : error ? (
          <p className="py-6 text-center text-sm text-rose-600">{error}</p>
        ) : !data ? (
          <AppEmptyState>ไม่มีข้อมูล</AppEmptyState>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AssetStatCard title="ทรัพย์สิน" value={`${data.totalAssets.toLocaleString("th-TH")} รายการ`} tone="violet" />
              <AssetStatCard title="มูลค่าซื้อรวม" value={formatTHB(data.totalPurchase)} tone="indigo" />
              <AssetStatCard title="มูลค่าคงเหลือ" value={formatTHB(data.totalCurrent)} tone="emerald" />
              <AssetStatCard title="เสื่อมราคารวม" value={formatTHB(data.depreciation)} tone="amber" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AppCompareBarList
                title="มูลค่าตามหมวดหมู่"
                emptyText="ยังไม่มีข้อมูล"
                rows={categoryRows}
                formatAmount={formatTHB}
                variant="brand"
              />
              <AppCompareBarList
                title="มูลค่าตามแผนก"
                emptyText="ยังไม่มีข้อมูล"
                rows={departmentRows}
                formatAmount={formatTHB}
                variant="slate"
              />
            </div>
          </>
        )}
      </AppDashboardSection>

      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="ส่งออกข้อมูล (CSV)"
          description="ดาวน์โหลดเป็นไฟล์ CSV เปิดใน Excel/Google Sheet ได้ทันที (รองรับภาษาไทย)"
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {EXPORTS.map((ex) => (
            <button
              key={ex.kind}
              type="button"
              onClick={() => downloadCsv(ex.kind)}
              className={cn(
                appTemplateOutlineButtonClass,
                "flex min-h-[44px] items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm",
              )}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </AppDashboardSection>
    </div>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}


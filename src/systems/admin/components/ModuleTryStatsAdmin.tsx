"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { downloadAdminExcel } from "@/lib/admin/export-excel";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import { resolveModuleCardDisplayImageUrl } from "@/lib/modules/dashboard-module-cover-images";

type ModuleTryPeriodKey = "today" | "month" | "year" | "custom";

type ModuleTryPeriodStats = {
  views: number;
  tryClicks: number;
  uniqueViews: number;
  uniqueTryClicks: number;
  conversionPct: number;
};

type ModuleTryStatsRow = {
  moduleSlug: string;
  moduleTitle: string;
  cardImageUrl: string | null;
  groupId: number;
  today: ModuleTryPeriodStats;
  month: ModuleTryPeriodStats;
  year: ModuleTryPeriodStats;
  filtered: ModuleTryPeriodStats;
};

type ApiPayload = {
  totals: {
    today: ModuleTryPeriodStats;
    month: ModuleTryPeriodStats;
    year: ModuleTryPeriodStats;
    filtered: ModuleTryPeriodStats;
  };
  rows: ModuleTryStatsRow[];
  campaigns: string[];
  filter: { fromYmd: string; toYmd: string; period: ModuleTryPeriodKey; label: string };
};

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}

function StatBlock({
  label,
  stats,
  emphasize,
}: {
  label: string;
  stats: ModuleTryPeriodStats;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border p-3 sm:p-4",
        emphasize
          ? "border-[#5b61ff]/35 bg-gradient-to-br from-[#ecebff]/90 via-white/80 to-fuchsia-50/40"
          : "border-white/70 bg-white/85",
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#66638c]">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xl font-black tabular-nums text-[#1e1b4b] sm:text-2xl">{stats.views}</p>
          <p className="text-[10px] font-semibold text-[#5f5a8a]">ดูหน้า · ไม่ซ้ำ {stats.uniqueViews}</p>
        </div>
        <div>
          <p className="text-xl font-black tabular-nums text-[#4d47b6] sm:text-2xl">{stats.tryClicks}</p>
          <p className="text-[10px] font-semibold text-[#5f5a8a]">กดทดลอง · ไม่ซ้ำ {stats.uniqueTryClicks}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold text-[#66638c]">แปลง {stats.conversionPct}%</p>
    </div>
  );
}

const PERIODS: { key: ModuleTryPeriodKey; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "month", label: "เดือนนี้" },
  { key: "year", label: "ปีนี้" },
  { key: "custom", label: "กำหนดเอง" },
];

export function ModuleTryStatsAdmin() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [period, setPeriod] = useState<ModuleTryPeriodKey>("month");
  const [moduleSlug, setModuleSlug] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [fromYmd, setFromYmd] = useState("");
  const [toYmd, setToYmd] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiPayload | null>(null);

  const filtersActive = Boolean(moduleSlug || utmCampaign || utmSource || period === "custom");

  const [modules, setModules] = useState<{ slug: string; title: string }[]>([]);

  useEffect(() => {
    void fetch("/api/admin/app-modules")
      .then((r) => r.json())
      .then((j: { modules?: { slug: string; title: string; isActive?: boolean }[] }) => {
        setModules((j.modules ?? []).filter((m) => m.isActive !== false).map((m) => ({ slug: m.slug, title: m.title })));
      })
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      qs.set("period", period);
      if (moduleSlug) qs.set("moduleSlug", moduleSlug);
      if (utmCampaign) qs.set("utmCampaign", utmCampaign);
      if (utmSource) qs.set("utmSource", utmSource);
      if (period === "custom") {
        if (fromYmd) qs.set("from", fromYmd);
        if (toYmd) qs.set("to", toYmd);
      }
      const res = await fetch(`/api/admin/try-stats?${qs.toString()}`);
      const j = (await res.json().catch(() => ({}))) as ApiPayload & { error?: string };
      if (!res.ok) throw new Error(j.error || "โหลดไม่สำเร็จ");
      setData(j);
      if (period === "custom") {
        if (!fromYmd && j.filter?.fromYmd) setFromYmd(j.filter.fromYmd);
        if (!toYmd && j.filter?.toYmd) setToYmd(j.filter.toYmd);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, moduleSlug, utmCampaign, utmSource, fromYmd, toYmd]);

  useEffect(() => {
    void load();
  }, [load]);

  const onExcel = () => {
    if (!data) return;
    downloadAdminExcel({
      filename: `try-stats-${data.filter.fromYmd}_${data.filter.toYmd}`,
      sheetName: "สถิติทดลอง",
      headers: [
        "โมดูล",
        "slug",
        "ดูหน้า (ช่วงกรอง)",
        "กดทดลอง (ช่วงกรอง)",
        "% แปลง",
        "ดูไม่ซ้ำ",
        "กดไม่ซ้ำ",
        "วันนี้ ดู",
        "วันนี้ กด",
        "เดือนนี้ ดู",
        "เดือนนี้ กด",
        "ปีนี้ ดู",
        "ปีนี้ กด",
      ],
      rows: data.rows.map((r) => [
        r.moduleTitle,
        r.moduleSlug,
        r.filtered.views,
        r.filtered.tryClicks,
        r.filtered.conversionPct,
        r.filtered.uniqueViews,
        r.filtered.uniqueTryClicks,
        r.today.views,
        r.today.tryClicks,
        r.month.views,
        r.month.tryClicks,
        r.year.views,
        r.year.tryClicks,
      ]),
    });
  };

  return (
    <div className="space-y-4">
      <AppDashboardSection className="space-y-4">
        <AppSectionHeader
          title="สถิติทดลองใช้"
          tone="violet"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="try-stats-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:min-w-0 sm:gap-1.5 sm:px-3",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <FilterIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive && !filterOpen ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
                ) : null}
              </button>
              <button
                type="button"
                onClick={onExcel}
                disabled={!data?.rows.length}
                aria-label="ส่งออก Excel"
                title="Excel"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 sm:min-w-0 sm:gap-1.5 sm:px-3",
                )}
              >
                <ExcelIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          }
        />

        <div id="try-stats-filter-panel" className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="ช่วงเวลา"
          >
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={period === p.key}
                className={cn(
                  "min-h-8 rounded-lg border px-2.5 text-[11px] font-black sm:min-h-9 sm:px-3.5 sm:text-xs",
                  period === p.key
                    ? "border-transparent bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] text-white"
                    : "border-[#e8e6fc] bg-white/80 text-[#4d47b6]",
                )}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === "custom" ? (
            <div className="grid grid-cols-2 gap-2 sm:max-w-md">
              <label className="block text-[10px] font-bold text-[#66638c]">
                จาก
                <input
                  type="date"
                  value={fromYmd}
                  onChange={(e) => setFromYmd(e.target.value)}
                  className="mt-1 w-full rounded-xl border-0 bg-[#f3f2fa]/90 px-3 py-2 text-sm text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
                />
              </label>
              <label className="block text-[10px] font-bold text-[#66638c]">
                ถึง
                <input
                  type="date"
                  value={toYmd}
                  onChange={(e) => setToYmd(e.target.value)}
                  className="mt-1 w-full rounded-xl border-0 bg-[#f3f2fa]/90 px-3 py-2 text-sm text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block text-[10px] font-bold text-[#66638c]">
              โมดูล
              <select
                value={moduleSlug}
                onChange={(e) => setModuleSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border-0 bg-[#f3f2fa]/90 px-3 py-2.5 text-sm text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
              >
                <option value="">ทั้งหมด</option>
                {modules.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[10px] font-bold text-[#66638c]">
              แคมเปญ (utm_campaign)
              <select
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="mt-1 w-full rounded-xl border-0 bg-[#f3f2fa]/90 px-3 py-2.5 text-sm text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
              >
                <option value="">ทั้งหมด</option>
                {(data?.campaigns ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[10px] font-bold text-[#66638c]">
              แหล่ง (utm_source)
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="เช่น facebook"
                className="mt-1 w-full rounded-xl border-0 bg-[#f3f2fa]/90 px-3 py-2.5 text-sm text-[#1e1b4b] outline-none ring-[#5b61ff]/20 focus:ring-2"
              />
            </label>
          </div>

          {filtersActive ? (
            <button
              type="button"
              className="text-xs font-bold text-[#5b61ff] underline-offset-2 hover:underline"
              onClick={() => {
                setModuleSlug("");
                setUtmCampaign("");
                setUtmSource("");
                setPeriod("month");
              }}
            >
              ล้างกรอง
            </button>
          ) : null}
        </div>

        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {err}
          </p>
        ) : null}

        {loading && !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-[1.25rem] bg-[#ecebff]/70" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatBlock label="วันนี้" stats={data.totals.today} />
            <StatBlock label="เดือนนี้" stats={data.totals.month} />
            <StatBlock
              label={period === "custom" ? `ช่วงกรอง (${data.filter.fromYmd}–${data.filter.toYmd})` : "ปีนี้"}
              stats={period === "custom" ? data.totals.filtered : data.totals.year}
              emphasize
            />
          </div>
        ) : null}
      </AppDashboardSection>

      <AppDashboardSection className="space-y-3">
        <AppSectionHeader title="แยกตามโมดูล" tone="violet" />
        {loading && !data?.rows.length ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[#ecebff]/70" />
            ))}
          </div>
        ) : !data?.rows.length ? (
          <AppEmptyState tone="violet">ยังไม่มีข้อมูลทดลองใช้ในช่วงที่เลือก</AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {data.rows.map((row) => {
              const cover = resolveModuleCardDisplayImageUrl(row.moduleSlug, row.cardImageUrl);
              const s = row.filtered;
              return (
                <li key={row.moduleSlug}>
                  <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-[#ecebff]">
                        {isSafeModuleCardDisplayUrl(cover) ? (
                          <Image src={cover} alt="" fill className="object-cover" sizes="44px" />
                        ) : null}
                      </div>
                      <span className="rounded-lg bg-[#0000BF]/10 px-2 py-0.5 text-[10px] font-black text-[#0000BF]">
                        {s.conversionPct}%
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black text-[#1e1b4b]">{row.moduleTitle}</p>
                      <p className="break-all text-[10px] font-semibold text-[#66638c]">{row.moduleSlug}</p>
                      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                        <div className="rounded-lg bg-[#f3f2fa]/90 px-1 py-1.5">
                          <p className="text-sm font-black tabular-nums text-[#1e1b4b]">{row.today.tryClicks}</p>
                          <p className="text-[9px] font-bold text-[#66638c]">วันนี้</p>
                        </div>
                        <div className="rounded-lg bg-[#f3f2fa]/90 px-1 py-1.5">
                          <p className="text-sm font-black tabular-nums text-[#1e1b4b]">{row.month.tryClicks}</p>
                          <p className="text-[9px] font-bold text-[#66638c]">เดือนนี้</p>
                        </div>
                        <div className="rounded-lg bg-[#f3f2fa]/90 px-1 py-1.5">
                          <p className="text-sm font-black tabular-nums text-[#1e1b4b]">{row.year.tryClicks}</p>
                          <p className="text-[9px] font-bold text-[#66638c]">ปีนี้</p>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-[#5f5a8a]">
                        ช่วงกรอง: ดู {s.views} · กด {s.tryClicks} · ไม่ซ้ำกด {s.uniqueTryClicks}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>
    </div>
  );
}

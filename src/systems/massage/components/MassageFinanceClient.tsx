"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  massageFinanceFieldClass,
  massageFinanceStatsGridClass,
  massageFinanceStatTailClass,
  massageFinanceSubTabShellClass,
  massageFilterChipClass,
  massageHorizontalScrollerClass,
  massagePageStackClass,
} from "@/systems/massage/components/massage-ui-tokens";
import type { MassageCostToolbarApi } from "@/systems/massage/components/MassageCostPanel";
import { MassageCostsClient } from "@/systems/massage/components/MassageCostsClient";
import { MassageHistoryClient } from "@/systems/massage/components/MassageHistoryClient";

// --- §14 Hotel-standard finance layout (โรงแรม pattern) ---

type FinanceListTab = "sales" | "costs";
type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

const FINANCE_SUBTABS: { id: FinanceListTab; label: string }[] = [
  { id: "sales", label: "ประวัติ / รายรับ" },
  { id: "costs", label: "รายจ่าย" },
];

const FINANCE_RANGES: { id: FinanceRange; label: string }[] = [
  { id: "TODAY", label: "วันนี้" },
  { id: "MONTH", label: "เดือนนี้" },
  { id: "YEAR", label: "ปีนี้" },
  { id: "CUSTOM", label: "กำหนดเอง" },
];

function financeRangeLabel(range: FinanceRange): string {
  const f = FINANCE_RANGES.find((r) => r.id === range);
  return f?.label ?? "เดือนนี้";
}

function formatBaht(n: number): string {
  if (!isFinite(n)) n = 0;
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

function todayYmd(): string {
  return new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function tabPillClass(active: boolean): string {
  return cn(
    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:min-h-[44px] sm:px-3 sm:text-sm",
    active
      ? "bg-gradient-to-r from-[#4338ca]/95 via-[#5b61ff]/95 to-[#ec4899]/85 text-white shadow-[0_10px_28px_-18px_rgba(124,58,237,0.55)] ring-1 ring-white/50"
      : "ring-1 ring-transparent text-[#5b61ff]/90 hover:bg-white/50 hover:text-[#1e1b4b]",
  );
}

function rangeChip(label: string, active: boolean, onClick: () => void) {
  return (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={cn(massageFilterChipClass(active), "inline-flex h-10 shrink-0 items-center justify-center px-3.5 sm:px-4")}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

/** Icon: ฟิลเตอร์ (filter funnel) — stroke เส้นโค้งมน 2.5, ไม่มี fill */
function IconFilter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16v2.172a2 2 0 0 1-.586 1.414L14 13v6l-4 2v-8L4.586 7.586A2 2 0 0 1 4 6.172z" />
    </svg>
  );
}

/** Icon: รีเฟรช refresh rotate 2.25 stroke */
function IconRefresh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 0 1-15.05 6.37L3 16.5M3 12a9 9 0 0 1 15.05-6.37L21 7.5" />
      <path d="M21 3v4.5h-4.5M3 21v-4.5h4.5" />
    </svg>
  );
}

/** Dummy chart buckets placeholder (ไม่ต้อง fetch สำหรับ baseline layout) — ให้กราฟไม่ว่างเปล่าในตอนแรก */
const BASELINE_CHART_BUCKETS = [
  { key: "d1", label: "จันทร์", revenue: 4200, cost: 900 },
  { key: "d2", label: "อังคาร", revenue: 6800, cost: 1350 },
  { key: "d3", label: "พุธ", revenue: 3100, cost: 820 },
  { key: "d4", label: "พฤหัส", revenue: 9450, cost: 2300 },
  { key: "d5", label: "ศุกร์", revenue: 12100, cost: 2900 },
  { key: "d6", label: "เสาร์", revenue: 14900, cost: 3650 },
  { key: "d7", label: "อาทิตย์", revenue: 8200, cost: 1850 },
];

function tabFromSearch(searchParams: URLSearchParams | null): FinanceListTab {
  return searchParams?.get("tab") === "costs" ? "costs" : "sales";
}

export function MassageFinanceClient({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  void baseUrl;
  void appDashboardInnerScrollClass;
  void Link;

  /** Default range = MONTH (ตรงโรงแรม default) */
  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const today = useMemo(() => todayYmd(), []);
  const [dateFrom, setDateFrom] = useState<string>(`${today.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState<string>(today);
  const [keyword, setKeyword] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(true);
  const [chartsOpen, setChartsOpen] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /** List tab sync จาก ?tab= sales / costs (query param sync) */
  const [listTab, setListTab] = useState<FinanceListTab>(() => tabFromSearch(searchParams));
  useEffect(() => setListTab(tabFromSearch(searchParams)), [searchParams]);
  const setFinanceListTab = useCallback(
    (next: FinanceListTab) => {
      setListTab(next);
      const q = next === "costs" ? "?tab=costs" : "";
      router.replace(`${pathname}${q}`, { scroll: false });
    },
    [pathname, router],
  );

  /** Stat cards (ตัวเลข mock baseline ตรง seed example — update ทีหลังเมื่อมี real API) */
  const demoRevenue = 58750;
  const demoCost = 13770;
  const demoProfit = demoRevenue - demoCost;
  const filtersActive = financeRange !== "MONTH" || Boolean(keyword.trim());

  const selectFinanceRange = (next: FinanceRange) => {
    setFinanceRange(next);
    if (next === "MONTH") {
      const y = today.slice(0, 7);
      setDateFrom(`${y}-01`);
      setDateTo(today);
    } else if (next === "YEAR") {
      const y = today.slice(0, 4);
      setDateFrom(`${y}-01-01`);
      setDateTo(today);
    } else if (next === "TODAY") {
      setDateFrom(today);
      setDateTo(today);
    }
  };

  const resetFilters = () => {
    setFinanceRange("MONTH");
    setDateFrom(`${today.slice(0, 7)}-01`);
    setDateTo(today);
    setKeyword("");
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      router.refresh();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  /** Pass-through embeddables for unified mode ใส่ใน sales/costs subtabs */
  const [costToolbar, setCostToolbar] = useState<MassageCostToolbarApi | null>(null);
  const [costToolbarBusy, setCostToolbarBusy] = useState<boolean>(true);

  return (
    <div className={massagePageStackClass}>
      {/* §14 Hotel-standard 3 stat cards TOP: รายได้(เขียว) · ต้นทุน(แดง) · กำไร(น้ำเงินเข้ม) */}
      <section aria-label={`สรุปการเงิน · ${financeRangeLabel(financeRange)}`}>
        <ul className={massageFinanceStatsGridClass}>
          <li className="rounded-xl border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40">
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              รายได้ · {financeRangeLabel(financeRange)}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
              {formatBaht(demoRevenue)}
            </p>
          </li>
          <li className="rounded-xl border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40">
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              ต้นทุน · {financeRangeLabel(financeRange)}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
              {formatBaht(demoCost)}
            </p>
          </li>
          <li
            className={cn(
              "rounded-xl border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40",
              massageFinanceStatTailClass,
            )}
          >
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              กำไรโดยประมาณ
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-[#1e1b4b] sm:text-3xl">
              {formatBaht(demoProfit)}
            </p>
          </li>
        </ul>
      </section>

      {/* §14 Main wrapper: AppDashboardSection tone=violet (ตรงโรงแรม) */}
      <AppDashboardSection tone="violet" className="rounded-[2rem]">
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              {/* Filter toggle: มี dot indicator เมื่อ filtersActive = true */}
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="massage-finance-filter-panel"
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                  filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span>{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ? (
                  <span
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>

              {/* Charts toggle: show/hide column chart */}
              <button
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="massage-finance-charts"
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                  chartsOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                )}
              >
                {chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
              </button>

              {/* Refresh: spin on loading */}
              <button
                type="button"
                onClick={() => void triggerRefresh()}
                disabled={refreshing}
                aria-busy={refreshing}
                title="รีเฟรช"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                  "disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-1.5", refreshing && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        {/* §14 Filter panel (collapseable) — เดือนนี้ default, match โรงแรม 4 range chips */}
        <div
          id="massage-finance-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className={cn(massageHorizontalScrollerClass, "flex-wrap gap-2")} role="group" aria-label="กรองช่วงเวลาการเงิน">
            {FINANCE_RANGES.map((r) =>
              rangeChip(r.label, financeRange === r.id, () => selectFinanceRange(r.id)),
            )}
          </div>
          {financeRange === "CUSTOM" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="ตั้งแต่วันที่ (กทม)"
                  className={cn(massageFinanceFieldClass, "mt-1")}
                />
              </label>
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="ถึงวันที่ (กทม)"
                  className={cn(massageFinanceFieldClass, "mt-1")}
                />
              </label>
            </div>
          ) : null}
          <div className={cn("grid gap-3", filtersActive ? "sm:grid-cols-12" : undefined)}>
            <label className={cn("min-w-0", filtersActive ? "sm:col-span-9" : undefined)}>
              <span className="sr-only">ค้นหา ชื่อลูกค้า เบอร์โทร หมอนวด หรือแพ็กเกจ</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า เบอร์โทร หมอนวด หรือแพ็กเกจ…"
                aria-label="ค้นหา ลูกค้า / หมอนวด / แพ็กเกจ"
                inputMode="search"
                className={cn(massageFinanceFieldClass, "mt-0")}
              />
            </label>
            {filtersActive ? (
              <div className="flex items-stretch sm:col-span-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-2xl px-3 text-sm font-black text-[#4d47b6]",
                  )}
                  aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
                >
                  รีเซ็ต · เดือนนี้
                </button>
              </div>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel(financeRange)}</p>
        </div>

        {/* §14 Charts Panel (collapseable) — AppSparkChartPanel + AppRevenueCostColumnChart */}
        {chartsOpen ? (
          <div id="massage-finance-charts" className="mt-4 space-y-4">
            <p className="text-sm font-black text-[#1e1b4b]">รายได้เทียบต้นทุน · {financeRangeLabel(financeRange)}</p>
            <AppSparkChartPanel className="w-full min-w-0">
              <AppRevenueCostColumnChart
                className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                compact
                title=""
                subtitle=""
                emptyText="ยังไม่มีข้อมูลในช่วงนี้"
                buckets={BASELINE_CHART_BUCKETS}
                formatTitle={(b) =>
                  `${b.label}: รายได้ ${formatBaht(b.revenue)} · ต้นทุน ${formatBaht(b.cost)}`
                }
              />
            </AppSparkChartPanel>
          </div>
        ) : null}

        {/* §14 Finance SubTabs (2 ใบ: ประวัติ/รายรับ · รายจ่าย) — massageFinanceSubTabShellClass gradient inset shadow */}
        <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
          <nav className={massageFinanceSubTabShellClass} aria-label="เมนูการเงิน">
            <div className="flex w-full min-w-0 gap-1" role="tablist">
              {FINANCE_SUBTABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={listTab === t.id}
                  id={`massage-finance-tab-${t.id}`}
                  aria-controls={`massage-finance-panel-${t.id}`}
                  onClick={() => setFinanceListTab(t.id)}
                  className={tabPillClass(listTab === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-4">
            {listTab === "sales" ? (
              <div id="massage-finance-panel-sales" role="tabpanel" aria-labelledby="massage-finance-tab-sales">
                <MassageHistoryClient
                  embedded
                  onFinanceListTabChange={setFinanceListTab}
                  financeListTab="sales"
                  costToolbar={costToolbar}
                  costToolbarBusy={costToolbarBusy}
                  costsPanel={null}
                />
              </div>
            ) : (
              <div id="massage-finance-panel-costs" role="tabpanel" aria-labelledby="massage-finance-tab-costs">
                <MassageCostsClient
                  baseUrl={baseUrl}
                  embedded
                  hideEmbeddedToolbar
                  onToolbarReady={setCostToolbar}
                  onBusyChange={setCostToolbarBusy}
                />
              </div>
            )}
          </div>
        </div>
      </AppDashboardSection>
    </div>
  );
}

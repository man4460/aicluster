"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appTemplateOutlineButtonClass,
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { formatVillageAmountStable } from "@/lib/village/format-display-stable";
import {
  VillageFinanceSubTabs,
  type VillageFinancePanel,
} from "@/systems/village/components/VillageFinanceSubTabs";
import { VillageFinanceHistoryPanel } from "@/systems/village/components/VillageFinanceHistoryPanel";
import {
  CostToolbarButtons,
  VillageCostsClient,
} from "@/systems/village/components/VillageCostsClient";
import type { BarberCostToolbarApi } from "@/systems/barber/components/BarberCostPanel";
import type { BarberCostCategory } from "@/systems/barber/barber-cost-client";
import { fetchVillageCostCategories } from "@/systems/village/village-cost-client";
import { VILLAGE_FINANCE_HREF } from "@/systems/village/village-nav";
import {
  villageBtnSecondary,
} from "@/systems/village/village-ui";
import {
  villageCardLargeRadiusClass,
  villageFieldClass,
  villageFilterChipClass,
  villageFinanceStatTailClass,
  villageFinanceStatsGridClass,
} from "@/systems/village/village-ui-tokens";

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

function parsePanel(raw: string | null): VillageFinancePanel {
  return raw === "expenses" ? "expenses" : "history";
}

function lastDayOfMonthYmd(ym: string): string {
  const y = parseInt(ym.slice(0, 4), 10);
  const m = parseInt(ym.slice(5, 7), 10);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function rangeDates(range: FinanceRange, today: string): { from: string; to: string } {
  if (range === "TODAY") return { from: today, to: today };
  if (range === "MONTH") {
    const ym = today.slice(0, 7);
    return { from: `${ym}-01`, to: lastDayOfMonthYmd(ym) };
  }
  if (range === "YEAR") {
    const y = today.slice(0, 4);
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

function FinanceRangeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        villageFilterChipClass(active),
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-3.5 sm:px-4",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-6.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  baseUrl: string;
};

export function VillageFinanceClient({ baseUrl }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const panel = parsePanel(searchParams.get("panel"));
  const today = bangkokDateKey();

  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState(`${today.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(lastDayOfMonthYmd(today.slice(0, 7)));
  const [keyword, setKeyword] = useState("");
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeErr, setFinanceErr] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<AppRevenueCostBucket[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [financeRangeLabel, setFinanceRangeLabel] = useState("เดือนนี้");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [costToolbar, setCostToolbar] = useState<BarberCostToolbarApi | null>(null);
  const [costBusy, setCostBusy] = useState(false);
  const [costCategories, setCostCategories] = useState<BarberCostCategory[]>([]);
  const [costFilterCat, setCostFilterCat] = useState<number | "all">("all");

  const filtersActive = financeRange !== "MONTH" || Boolean(keyword.trim());

  const setPanel = useCallback(
    (next: VillageFinancePanel) => {
      const href = next === "history" ? VILLAGE_FINANCE_HREF : `${VILLAGE_FINANCE_HREF}?panel=${next}`;
      router.replace(href, { scroll: false });
    },
    [router],
  );

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceErr(null);
    try {
      const qs = new URLSearchParams();
      if (dateFrom) qs.set("from", dateFrom);
      if (dateTo) qs.set("to", dateTo);
      const q = qs.toString() ? `?${qs.toString()}` : "";
      const res = await fetch(`/api/village/finance/monthly-revenue-cost${q}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        buckets?: AppRevenueCostBucket[];
        totalRevenue?: number;
        totalCost?: number;
        rangeLabel?: string;
        error?: string;
      };
      if (!res.ok) {
        setBuckets([]);
        setTotalRevenue(0);
        setTotalCost(0);
        setFinanceErr(data.error ?? "โหลดสรุปไม่สำเร็จ");
        return;
      }
      setBuckets(Array.isArray(data.buckets) ? data.buckets : []);
      setTotalRevenue(data.totalRevenue ?? 0);
      setTotalCost(data.totalCost ?? 0);
      setFinanceRangeLabel(data.rangeLabel ?? "ช่วงที่เลือก");
    } catch {
      setBuckets([]);
      setTotalRevenue(0);
      setTotalCost(0);
      setFinanceErr("โหลดสรุปไม่สำเร็จ");
    } finally {
      setFinanceLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance, refreshSignal]);

  useEffect(() => {
    if (panel !== "expenses") return;
    void fetchVillageCostCategories()
      .then(setCostCategories)
      .catch(() => setCostCategories([]));
  }, [panel, refreshSignal]);

  function selectFinanceRange(next: FinanceRange) {
    setFinanceRange(next);
    if (next === "CUSTOM") return;
    const { from, to } = rangeDates(next, bangkokDateKey());
    setDateFrom(from);
    setDateTo(to);
  }

  function resetFilters() {
    const t = bangkokDateKey();
    setFinanceRange("MONTH");
    setDateFrom(`${t.slice(0, 7)}-01`);
    setDateTo(lastDayOfMonthYmd(t.slice(0, 7)));
    setKeyword("");
  }

  function handleRefresh() {
    setRefreshSignal((n) => n + 1);
  }

  const chartBuckets = useMemo(() => {
    const max = Math.max(1, ...buckets.map((x) => Math.max(x.revenue, x.cost)));
    return buckets.map((b) => ({
      key: b.key,
      label: b.label,
      revenue: b.revenue,
      cost: b.cost,
      revenuePct: (b.revenue / max) * 100,
      costPct: (b.cost / max) * 100,
    }));
  }, [buckets]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section aria-label={`สรุปการเงิน ${financeRangeLabel}`}>
        <ul className={villageFinanceStatsGridClass}>
          <li className="rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40">
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              รายได้ · {financeRangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
              ฿{formatVillageAmountStable(totalRevenue)}
            </p>
          </li>
          <li className="rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40">
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              ต้นทุน · {financeRangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
              ฿{formatVillageAmountStable(totalCost)}
            </p>
          </li>
          <li
            className={cn(
              "rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40",
              villageFinanceStatTailClass,
            )}
          >
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
              กำไรโดยประมาณ
            </p>
            <p
              className={cn(
                "mt-2 text-left text-2xl font-black tabular-nums sm:text-3xl",
                totalRevenue - totalCost < 0 ? "text-rose-800" : "text-[#1e1b4b]",
              )}
            >
              ฿{formatVillageAmountStable(totalRevenue - totalCost)}
            </p>
          </li>
        </ul>
      </section>

      <AppDashboardSection tone="violet" className={villageCardLargeRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="village-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] items-center justify-center gap-1.5 px-3 text-xs font-black text-[#4d47b6]",
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
              <button
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="village-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center px-3 text-xs font-black text-[#4d47b6]",
                  chartsOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                )}
              >
                {chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={financeLoading}
                aria-busy={financeLoading}
                aria-label="รีเฟรชข้อมูลรายงาน"
                title="รีเฟรช"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[1rem] px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                  "disabled:opacity-50",
                )}
              >
                <IconRefresh className={cn("h-5 w-5 shrink-0 sm:mr-1.5", financeLoading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        <div
          id="village-finance-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
            <FinanceRangeChip label="วันนี้" active={financeRange === "TODAY"} onClick={() => selectFinanceRange("TODAY")} />
            <FinanceRangeChip label="เดือนนี้" active={financeRange === "MONTH"} onClick={() => selectFinanceRange("MONTH")} />
            <FinanceRangeChip label="ปีนี้" active={financeRange === "YEAR"} onClick={() => selectFinanceRange("YEAR")} />
            <FinanceRangeChip
              label="กำหนดเอง"
              active={financeRange === "CUSTOM"}
              onClick={() => selectFinanceRange("CUSTOM")}
            />
          </div>
          {financeRange === "CUSTOM" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="ตั้งแต่วันที่ กรุงเทพ"
                  className={villageFieldClass}
                />
              </label>
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="ถึงวันที่ กรุงเทพ"
                  className={villageFieldClass}
                />
              </label>
            </div>
          ) : null}
          <div className={cn("grid gap-3", filtersActive ? "sm:grid-cols-12" : undefined)}>
            <label className={cn("min-w-0", filtersActive ? "sm:col-span-9" : undefined)}>
              <span className="sr-only">ค้นหาบ้าน ผู้ถือกรรมสิทธิ์ หรืองวด</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาบ้าน เจ้าบ้าน หรืองวด…"
                aria-label="ค้นหาบ้าน เจ้าบ้าน หรืองวด"
                inputMode="search"
                className={cn(villageFieldClass, "mt-0")}
              />
            </label>
            {filtersActive ? (
              <div className="flex items-stretch sm:col-span-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    villageBtnSecondary,
                    "inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-2xl px-3 text-sm font-black text-[#4d47b6]",
                  )}
                  aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
                >
                  รีเซ็ต · เดือนนี้
                </button>
              </div>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel}</p>
        </div>

        {chartsOpen ? (
          <div id="village-finance-charts" className="mt-4 space-y-4">
            <p className="text-sm font-black text-[#1e1b4b]">รายได้เทียบต้นทุน · {financeRangeLabel}</p>
            {financeErr ? <p className="text-sm text-amber-800">{financeErr}</p> : null}
            {financeLoading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />
            ) : (
              <AppSparkChartPanel className="w-full min-w-0">
                <AppRevenueCostColumnChart
                  className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                  compact
                  title=""
                  subtitle=""
                  emptyText="ไม่มีข้อมูลในช่วงนี้"
                  buckets={chartBuckets}
                  formatTitle={(b) =>
                    `รายได้ ${formatVillageAmountStable(b.revenue)} · ต้นทุน ${formatVillageAmountStable(b.cost)}`
                  }
                />
              </AppSparkChartPanel>
            )}
          </div>
        ) : null}

        <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
          <VillageFinanceSubTabs panel={panel} onPanelChange={setPanel} />

          {panel === "history" ? (
            <div id="village-finance-panel-history" role="tabpanel" aria-labelledby="village-finance-tab-history">
              <VillageFinanceHistoryPanel
                keyword={keyword}
                dateFrom={dateFrom}
                dateTo={dateTo}
                financeRangeLabel={financeRangeLabel}
                refreshSignal={refreshSignal}
                onRefreshFinance={handleRefresh}
              />
            </div>
          ) : null}

          {panel === "expenses" ? (
            <div id="village-finance-panel-expenses" role="tabpanel" aria-labelledby="village-finance-tab-expenses">
              <AppSectionHeader
                tone="slate"
                title="รายจ่าย"
                className="flex flex-row items-start justify-between gap-3 sm:items-center"
                actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                action={<CostToolbarButtons toolbar={costToolbar} busy={costBusy} compact />}
              />
              <p className="mt-2 text-xs font-semibold text-[#66638c]">ต้นทุน · {financeRangeLabel}</p>

              <div
                className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
                role="group"
                aria-label="กรองตามหมวดหมู่รายจ่าย — เลื่อนซ้ายขวาได้"
              >
                <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
                  <button
                    type="button"
                    onClick={() => setCostFilterCat("all")}
                    className={cn("shrink-0 snap-start transition", villageFilterChipClass(costFilterCat === "all"))}
                    aria-pressed={costFilterCat === "all"}
                  >
                    ทั้งหมด
                  </button>
                  {costCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCostFilterCat(c.id)}
                      className={cn("shrink-0 snap-start transition", villageFilterChipClass(costFilterCat === c.id))}
                      aria-pressed={costFilterCat === c.id}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {costCategories.length === 0 ? (
                <p className="mt-3 text-xs font-semibold text-amber-800">
                  สร้างหมวดก่อนจึงจะบันทึกรายจ่ายได้ — กด «หมวด»
                </p>
              ) : null}

              <div className="mt-4">
                <VillageCostsClient
                  baseUrl={baseUrl}
                  listOnly
                  refreshSignal={refreshSignal}
                  onToolbarReady={setCostToolbar}
                  onLoadingChange={setCostBusy}
                  onCategoriesReady={setCostCategories}
                  filterCategoryId={costFilterCat}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                />
              </div>
            </div>
          ) : null}
        </div>
      </AppDashboardSection>
    </div>
  );
}

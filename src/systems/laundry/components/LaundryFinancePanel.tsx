"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  type AppCompareBarRow,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  barberFinanceRangeBounds,
  type BarberFinanceRange,
} from "@/lib/barber/finance-range";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { HomeFinanceListHeading } from "@/systems/home-finance/components/HomeFinanceUi";
import { LaundryCostPanel } from "@/systems/laundry/components/LaundryCostPanel";
import { LaundryOrderCard } from "@/systems/laundry/components/LaundryOrderCard";
import { LaundryRevenuePanel } from "@/systems/laundry/components/LaundryRevenuePanel";
import { laundryDashboardCardGridClass } from "@/systems/laundry/laundry-dashboard-layout";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryCostCategory,
  type LaundryCostEntry,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryRepository,
  type LaundryRevenueCategory,
  type LaundryRevenueEntry,
} from "@/systems/laundry/laundry-service";
import {
  laundryDashboardSegmentBtnClass,
  laundryDashboardSegmentShellClass,
  laundryPrimaryTabPillClass,
  laundryPrimaryTabShellClass,
} from "@/systems/laundry/lib/ui-tokens";

const MAX_COMPARE_ROWS = 18;

type HistoryLog = {
  id: number;
  visitType: string;
  note: string | null;
  amountBaht: string | null;
  createdAt: string;
  customer: { phone: string; name: string | null };
};

type HistorySummary = {
  revenueCashBaht: number;
  revenuePackageBaht: number;
  revenueNewPackageBaht: number;
  revenueTotalBaht: number;
};

function capLeaderboard(entries: [string, number][], max: number): [string, number][] {
  if (entries.length <= max) return entries;
  const head = entries.slice(0, max - 1);
  const tail = entries.slice(max - 1);
  const restSum = tail.reduce((s, [, a]) => s + a, 0);
  return [...head, ["อื่น ๆ รวม", restSum]];
}

function entriesToBarRows(entries: [string, number][]): AppCompareBarRow[] {
  if (entries.length === 0) return [];
  const maxAmt = Math.max(...entries.map(([, a]) => a), 1);
  return entries.map(([label, amount], i) => ({
    key: `${label}__${i}`,
    label,
    amount,
    pct: Math.round((amount / maxAmt) * 100),
  }));
}

function donutGradientFromRows(rows: AppCompareBarRow[]): string {
  if (rows.length === 0) return "conic-gradient(#e5e7eb 0deg 360deg)";
  const palette = ["#5b61ff", "#8d64ff", "#f06dc8", "#22c55e", "#f59e0b", "#ef4444"];
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  if (total <= 0) return "conic-gradient(#e5e7eb 0deg 360deg)";
  let acc = 0;
  const segments = rows.slice(0, 6).map((row, index) => {
    const start = Math.round((acc / total) * 360);
    acc += row.amount;
    const end = Math.round((acc / total) * 360);
    return `${palette[index % palette.length]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${segments.join(", ")})`;
}

function orderDateKeyBangkok(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function formatChartLabel(isoDateKey: string): string {
  const p = isoDateKey.split("-").map(Number);
  return `${p[2] ?? 0}/${p[1] ?? 0}`;
}

function orderCountsTowardRevenue(o: LaundryOrder): boolean {
  return o.status !== "CANCELLED";
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function visitLabel(v: string): string {
  if (v === "PACKAGE_USE") return "หักแพ็กเกจ";
  if (v === "PACKAGE_SALE") return "ขายแพ็กเกจ";
  if (v === "CASH_WALK_IN") return "Walk-in";
  return v;
}

function financeRangeLabelTh(range: BarberFinanceRange, from: string, to: string): string {
  if (range === "TODAY") return "วันนี้";
  if (range === "MONTH") return "เดือนนี้";
  if (range === "YEAR") return "ปีนี้";
  if (from && to && from !== to) return `${from} ถึง ${to}`;
  if (from || to) return `วันที่ ${from || to}`;
  return "กำหนดเอง";
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
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-3.5 text-xs font-bold transition-all sm:text-sm",
        active ?
          "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] text-white shadow-md"
        : "border border-white/60 bg-white/70 text-[#4d47b6] hover:border-indigo-200",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14v4M12 9v9M17 5v13" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function matchesSearchOrder(o: LaundryOrder, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [o.customer_name, o.customer_phone, o.package_name, o.pickup_address, o.note, o.recorded_by_name]
    .join(" ")
    .toLowerCase();
  return blob.includes(s);
}

function matchesSearchLog(l: HistoryLog, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [l.customer.phone, l.customer.name, l.note, l.visitType].join(" ").toLowerCase();
  return blob.includes(s);
}

export function LaundryFinancePanel({
  orders,
  costCategories,
  costEntries,
  revenueCategories = [],
  revenueEntries = [],
  repo,
  baseUrl,
  onRefresh,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onPrintOrder,
}: {
  orders: LaundryOrder[];
  costCategories: LaundryCostCategory[];
  costEntries: LaundryCostEntry[];
  revenueCategories?: LaundryRevenueCategory[];
  revenueEntries?: LaundryRevenueEntry[];
  repo: LaundryRepository;
  baseUrl: string;
  onRefresh: () => Promise<void>;
  onViewOrder: (o: LaundryOrder) => void;
  onEditOrder: (o: LaundryOrder) => void;
  onDeleteOrder: (o: LaundryOrder) => void | Promise<void>;
  onStatusChange: (id: number, status: LaundryOrderStatus) => void | Promise<void>;
  onPrintOrder?: (o: LaundryOrder) => void;
}) {
  const todayKey = bangkokDateKey();
  const [financeRange, setFinanceRange] = useState<BarberFinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState(`${todayKey.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(todayKey);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [activeListTab, setActiveListTab] = useState<"sales" | "costs">("sales");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | LaundryOrderStatus>("all");

  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(null);
  const [rangeLabel, setRangeLabel] = useState("เดือนนี้");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const rangeBounds = useMemo(
    () => barberFinanceRangeBounds(financeRange, dateFrom, dateTo),
    [financeRange, dateFrom, dateTo],
  );

  const filtersActive = financeRange !== "MONTH" || search.trim().length > 0;

  const resetFilters = useCallback(() => {
    setFinanceRange("MONTH");
    setDateFrom(`${todayKey.slice(0, 7)}-01`);
    setDateTo(todayKey);
    setSearch("");
  }, [todayKey]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const params = new URLSearchParams({ range: financeRange });
      if (financeRange === "CUSTOM") {
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
      }
      const q = search.trim();
      if (q) params.set("q", q);
      const res = await fetch(`/api/laundry/history?${params.toString()}`, { credentials: "include" });
      const data = (await res.json()) as {
        logs?: HistoryLog[];
        summary?: HistorySummary;
        meta?: { rangeLabel?: string };
        error?: string;
      };
      if (!res.ok) {
        setHistoryError(data.error ?? "โหลดประวัติไม่สำเร็จ");
        setHistoryLogs([]);
        setHistorySummary(null);
        return;
      }
      setHistoryLogs(Array.isArray(data.logs) ? data.logs : []);
      setHistorySummary(data.summary ?? null);
      setRangeLabel(data.meta?.rangeLabel ?? financeRangeLabelTh(financeRange, dateFrom, dateTo));
    } catch {
      setHistoryError("เชื่อมต่อไม่สำเร็จ");
      setHistoryLogs([]);
      setHistorySummary(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [financeRange, dateFrom, dateTo, search]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const filteredOrdersBase = useMemo(() => {
    const { start, end } = rangeBounds;
    return orders.filter(
      (o) => inRange(o.order_at, start, end) && matchesSearchOrder(o, search),
    );
  }, [orders, rangeBounds, search]);

  const filteredOrdersForRevenue = useMemo(() => {
    return filteredOrdersBase.filter(orderCountsTowardRevenue);
  }, [filteredOrdersBase]);

  const filteredOrdersList = useMemo(() => {
    if (orderStatusFilter === "all") return filteredOrdersBase;
    return filteredOrdersBase.filter((o) => o.status === orderStatusFilter);
  }, [filteredOrdersBase, orderStatusFilter]);

  const filteredCostEntries = useMemo(() => {
    const { start, end } = rangeBounds;
    return costEntries.filter((e) => inRange(e.spent_at, start, end));
  }, [costEntries, rangeBounds]);

  const filteredRevenueEntries = useMemo(() => {
    const { start, end } = rangeBounds;
    return revenueEntries.filter((e) => inRange(e.earned_at, start, end));
  }, [revenueEntries, rangeBounds]);

  const filteredHistoryLogs = useMemo(() => {
    return historyLogs.filter((l) => matchesSearchLog(l, search));
  }, [historyLogs, search]);

  const ordersRevenue = useMemo(
    () => filteredOrdersForRevenue.reduce((s, o) => s + o.final_price, 0),
    [filteredOrdersForRevenue],
  );

  const manualRevenue = useMemo(
    () => filteredRevenueEntries.reduce((s, e) => s + e.amount, 0),
    [filteredRevenueEntries],
  );

  const historyRevenue = useMemo(() => {
    if (!historySummary) return 0;
    return (
      historySummary.revenueTotalBaht +
      (historySummary.revenuePackageBaht ?? 0)
    );
  }, [historySummary]);

  const periodTotalRevenue = historyRevenue + ordersRevenue + manualRevenue;
  const periodTotalCost = useMemo(
    () => filteredCostEntries.reduce((a, e) => a + e.amount, 0),
    [filteredCostEntries],
  );

  const revenueCostBuckets = useMemo(() => {
    const revenueByDay = new Map<string, number>();
    const costByDay = new Map<string, number>();

    for (const l of filteredHistoryLogs) {
      const amt = l.amountBaht != null ? Number(l.amountBaht) : 0;
      if (Number.isFinite(amt) && amt > 0) {
        const k = orderDateKeyBangkok(l.createdAt);
        revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + amt);
      }
    }
    for (const o of filteredOrdersForRevenue) {
      const k = orderDateKeyBangkok(o.order_at);
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + o.final_price);
    }
    for (const e of filteredRevenueEntries) {
      const k = orderDateKeyBangkok(e.earned_at);
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + e.amount);
    }
    for (const e of filteredCostEntries) {
      const k = orderDateKeyBangkok(e.spent_at);
      costByDay.set(k, (costByDay.get(k) ?? 0) + e.amount);
    }

    const allKeys = new Set<string>([...revenueByDay.keys(), ...costByDay.keys()]);
    const keys = Array.from(allKeys).sort();
    const maxBars = 36;
    const slice = keys.length > maxBars ? keys.slice(-maxBars) : keys;
    const maxVal = Math.max(1, ...slice.flatMap((k) => [revenueByDay.get(k) ?? 0, costByDay.get(k) ?? 0]));
    return slice.map((k) => {
      const revenue = revenueByDay.get(k) ?? 0;
      const cost = costByDay.get(k) ?? 0;
      return {
        key: k,
        label: formatChartLabel(k),
        revenue,
        cost,
        revenuePct: Math.round((revenue / maxVal) * 100),
        costPct: Math.round((cost / maxVal) * 100),
      };
    });
  }, [filteredHistoryLogs, filteredOrdersForRevenue, filteredRevenueEntries, filteredCostEntries]);

  const packageCompareRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const o of filteredOrdersForRevenue) {
      const label = o.package_name.trim() || "ไม่ระบุแพ็กเกจ";
      totals.set(label, (totals.get(label) ?? 0) + o.final_price);
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return entriesToBarRows(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [filteredOrdersForRevenue]);

  const filterPanel = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
        <FinanceRangeChip label="วันนี้" active={financeRange === "TODAY"} onClick={() => setFinanceRange("TODAY")} />
        <FinanceRangeChip label="เดือนนี้" active={financeRange === "MONTH"} onClick={() => setFinanceRange("MONTH")} />
        <FinanceRangeChip label="ปีนี้" active={financeRange === "YEAR"} onClick={() => setFinanceRange("YEAR")} />
        <FinanceRangeChip label="กำหนดเอง" active={financeRange === "CUSTOM"} onClick={() => setFinanceRange("CUSTOM")} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {financeRange === "CUSTOM" ?
          <>
            <label className="min-w-0 flex-1 sm:max-w-[11rem]">
              <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
              <input
                type="date"
                className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="min-w-0 flex-1 sm:max-w-[11rem]">
              <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
              <input
                type="date"
                className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </>
        : null}
        <label className="min-w-0 flex-1 sm:max-w-[16rem]">
          <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
          <input
            className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm font-semibold placeholder:text-slate-400"
            placeholder="ชื่อ, เบอร์, แพ็กเกจ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {filtersActive ?
          <button
            type="button"
            onClick={resetFilters}
            className={cn(laundryDashboardSegmentBtnClass(false), "h-11 min-h-[44px] px-4")}
          >
            รีเซ็ต · เดือนนี้
          </button>
        : null}
      </div>
      <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {rangeLabel}</p>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ภาพรวมการเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className={cn(laundryDashboardSegmentShellClass, "max-w-full")} role="group" aria-label="เครื่องมือการเงิน">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="laundry-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  laundryDashboardSegmentBtnClass(filterOpen),
                  "relative min-h-[40px] min-w-[40px] sm:min-w-0",
                  filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
                )}
              >
                <IconFilter className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ?
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white" aria-hidden />
                : null}
              </button>
              <button
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="laundry-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={cn(laundryDashboardSegmentBtnClass(chartsOpen), "min-h-[40px] min-w-[40px] sm:min-w-0")}
              >
                <IconChart className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
              </button>
              <button
                type="button"
                onClick={() => void Promise.all([fetchHistory(), onRefresh()])}
                disabled={historyLoading}
                aria-busy={historyLoading}
                aria-label="รีเฟรชข้อมูลรายงาน"
                title="รีเฟรช"
                className={cn(laundryDashboardSegmentBtnClass(false), "min-h-[40px] min-w-[40px] disabled:opacity-50 sm:min-w-0")}
              >
                <IconRefresh className={cn("h-3.5 w-3.5 shrink-0", historyLoading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        <div id="laundry-finance-filter-panel" className={cn("mt-3 space-y-3", filterOpen ? "block" : "hidden")}>
          {filterPanel}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-4">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 via-violet-50/35 to-indigo-100/30 p-3 shadow-[0_16px_34px_-24px_rgba(91,97,255,0.4)] backdrop-blur-xl sm:p-5">
            <span className="truncate text-[8px] font-bold uppercase tracking-wider text-violet-500 sm:text-[10px]">รายได้รวม</span>
            <p className="mt-2 text-sm font-black text-[#1e1b4b] sm:mt-3 sm:text-2xl">฿{periodTotalRevenue.toLocaleString("th-TH")}</p>
          </div>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 via-rose-50/30 to-orange-100/25 p-3 shadow-[0_16px_34px_-24px_rgba(244,63,94,0.35)] backdrop-blur-xl sm:p-5">
            <span className="truncate text-[8px] font-bold uppercase tracking-wider text-rose-500 sm:text-[10px]">รายจ่ายรวม</span>
            <p className="mt-2 text-sm font-black text-rose-900 sm:mt-3 sm:text-2xl">฿{periodTotalCost.toLocaleString("th-TH")}</p>
          </div>
          <div
            className={cn(
              "relative col-span-2 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 p-3 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.32)] backdrop-blur-xl sm:p-5",
              periodTotalRevenue - periodTotalCost >= 0 ?
                "bg-gradient-to-br from-white/60 to-emerald-100/28"
              : "bg-gradient-to-br from-white/60 to-orange-100/28",
            )}
          >
            <span className={cn("truncate text-[8px] font-bold uppercase tracking-wider sm:text-[10px]", periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-600" : "text-orange-600")}>
              กำไรสุทธิ
            </span>
            <p className={cn("mt-2 text-sm font-black sm:mt-3 sm:text-2xl", periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-900" : "text-orange-900")}>
              ฿{(periodTotalRevenue - periodTotalCost).toLocaleString("th-TH")}
            </p>
          </div>
        </div>

        {chartsOpen ?
          <div id="laundry-finance-charts" className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
              <h3 className="mb-2 text-sm font-black text-[#1e1b4b] sm:text-base">แนวโน้มรายได้และรายจ่าย · {rangeLabel}</h3>
              <div className="h-[200px] w-full sm:h-[260px]">
                <AppRevenueCostColumnChart
                  className="h-full w-full"
                  compact
                  buckets={revenueCostBuckets}
                  title=""
                  emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
                  formatTitle={(b) =>
                    `${b.label}: รายได้ ฿${b.revenue.toLocaleString("th-TH")} · รายจ่าย ฿${b.cost.toLocaleString("th-TH")}`
                  }
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl">
              <h3 className="text-xs font-black text-[#1e1b4b] sm:text-sm">สัดส่วนตามแพ็กเกจ (งานรับ–ส่ง)</h3>
              {packageCompareRows.length > 0 ?
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-full ring-4 ring-slate-50 sm:h-20 sm:w-20" style={{ background: donutGradientFromRows(packageCompareRows) }} aria-hidden />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {packageCompareRows.slice(0, 4).map((row, idx) => (
                      <div key={row.key} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="truncate font-medium text-slate-500">{row.label}</span>
                        <span className="font-bold text-[#1e1b4b]">฿{row.amount.toLocaleString("th-TH")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              : <p className="mt-4 text-center text-[10px] text-slate-400">ไม่มีข้อมูล</p>}
            </div>
          </div>
        : null}
      </AppDashboardSection>

      <AppDashboardSection tone="slate">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/55 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <HomeFinanceListHeading className="mb-0">
              {activeListTab === "sales" ? "รายรับ" : "รายจ่าย"}
            </HomeFinanceListHeading>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {activeListTab === "sales" ?
                `ประวัติบริการ ${filteredHistoryLogs.length} · งาน ${filteredOrdersList.length} รายการ`
              : `รายจ่าย ${filteredCostEntries.length} รายการ`}
            </p>
          </div>
          <nav className={laundryPrimaryTabShellClass} role="tablist" aria-label="รายรับหรือรายจ่าย">
            <button type="button" role="tab" aria-selected={activeListTab === "sales"} className={laundryPrimaryTabPillClass(activeListTab === "sales")} onClick={() => setActiveListTab("sales")}>
              รายรับ
            </button>
            <button type="button" role="tab" aria-selected={activeListTab === "costs"} className={laundryPrimaryTabPillClass(activeListTab === "costs")} onClick={() => setActiveListTab("costs")}>
              รายจ่าย
            </button>
          </nav>
        </div>

        {activeListTab === "sales" ?
          <div className="mt-4 space-y-6">
            {historyError ?
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{historyError}</p>
            : null}
            {historyLoading ?
              <p className="text-center text-sm text-slate-500">กำลังโหลดประวัติบริการ…</p>
            : filteredHistoryLogs.length === 0 ?
              <AppEmptyState tone="glass">ไม่มีประวัติบริการในช่วงที่เลือก</AppEmptyState>
            : <ul className="space-y-2" aria-label="ประวัติบริการ">
                {filteredHistoryLogs.map((l) => {
                  const amt = l.amountBaht != null ? Number(l.amountBaht) : NaN;
                  return (
                    <li key={l.id} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#1e1b4b]">{visitLabel(l.visitType)}</p>
                          <p className="text-xs text-slate-600">
                            {l.customer.name?.trim() || l.customer.phone}
                            {l.note?.trim() ? ` · ${l.note.trim()}` : ""}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {new Date(l.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                          </p>
                        </div>
                        {Number.isFinite(amt) && amt > 0 ?
                          <p className="shrink-0 text-lg font-black tabular-nums text-emerald-700">฿{amt.toLocaleString("th-TH")}</p>
                        : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            }

            <div>
              <h3 className="mb-3 text-sm font-black text-[#1e1b4b]">งานรับ–ส่ง / ออเดอร์</h3>
              <label className="text-xs font-semibold text-slate-600">
                กรองตามสถานะ
                <select
                  className="app-input ml-2 mt-1 min-h-[40px] rounded-xl px-3 py-2 text-sm sm:mt-0"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as typeof orderStatusFilter)}
                >
                  <option value="all">ทั้งหมด ({filteredOrdersBase.length})</option>
                  {LAUNDRY_ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {laundryOrderStatusLabelTh(s)} ({filteredOrdersBase.filter((o) => o.status === s).length})
                    </option>
                  ))}
                </select>
              </label>
              {filteredOrdersList.length === 0 ?
                <AppEmptyState tone="glass" className="mt-3">ไม่พบออเดอร์ตามเงื่อนไข</AppEmptyState>
              : <ul className={cn(laundryDashboardCardGridClass, "mt-3 list-none p-0")} aria-label="ออเดอร์ซักผ้า">
                  {filteredOrdersList.map((o) => (
                    <li key={o.id} className="min-h-0 min-w-0">
                      <LaundryOrderCard
                        order={o}
                        tone="slate"
                        showStatusSelect={false}
                        showOrderedAt
                        onView={() => onViewOrder(o)}
                        onEdit={() => onEditOrder(o)}
                        onDelete={() => void onDeleteOrder(o)}
                        onPrint={onPrintOrder ? () => onPrintOrder(o) : undefined}
                        onStatusChange={onStatusChange}
                      />
                    </li>
                  ))}
                </ul>
              }
            </div>

            <div>
              <h3 className="mb-3 text-sm font-black text-[#1e1b4b]">รายรับเพิ่ม (บันทึกด้วยตนเอง)</h3>
              <LaundryRevenuePanel
                repo={repo}
                baseUrl={baseUrl}
                categories={revenueCategories}
                entries={filteredRevenueEntries}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        : <div className="mt-4">
            <LaundryCostPanel
              repo={repo}
              baseUrl={baseUrl}
              categories={costCategories}
              entries={filteredCostEntries}
              onRefresh={onRefresh}
            />
          </div>
        }
      </AppDashboardSection>
    </div>
  );
}

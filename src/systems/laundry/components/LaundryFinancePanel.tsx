"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppRevenueCostColumnChart,
  type AppCompareBarRow,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  barberFinanceRangeBounds,
  type BarberFinanceRange,
} from "@/lib/barber/finance-range";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { LaundryCostPanel, type LaundryCostPanelHandle } from "@/systems/laundry/components/LaundryCostPanel";
import {
  LaundryRevenuePanel,
  type LaundryRevenuePanelHandle,
} from "@/systems/laundry/components/LaundryRevenuePanel";
import { LaundryServiceHistoryList } from "@/systems/laundry/components/LaundryServiceHistoryList";
import { LaundryRefreshButton } from "@/systems/laundry/components/LaundryRefreshButton";
import {
  type LaundryCostCategory,
  type LaundryCostEntry,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryRepository,
  type LaundryRevenueCategory,
  type LaundryRevenueEntry,
} from "@/systems/laundry/laundry-service";
import {
  laundryCompactOutlineButtonClass,
  laundryFinanceRangeChipClass,
  laundryFinanceStatTailClass,
  laundryFinanceStatsGridClass,
  laundryInlineSubNavBtnClass,
  laundryInlineSubNavShellClass,
  laundryPanelClass,
  laundryPanelDividerClass,
  laundryPanelSectionClass,
  laundrySectionHeadingClass,
  laundryStatInlineClass,
} from "@/systems/laundry/lib/ui-tokens";

const MAX_COMPARE_ROWS = 18;

type HistoryLog = {
  id: number;
  visitType: string;
  note: string | null;
  packageName?: string | null;
  packageDescription?: string | null;
  amountBaht: string | null;
  paymentMethod?: string | null;
  receiptImageUrl?: string | null;
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
    <button type="button" onClick={onClick} className={laundryFinanceRangeChipClass(active)} aria-pressed={active}>
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
  const blob = [l.customer.phone, l.customer.name, l.note, l.packageName, l.packageDescription, l.visitType]
    .join(" ")
    .toLowerCase();
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
  const revenuePanelRef = useRef<LaundryRevenuePanelHandle>(null);
  const costPanelRef = useRef<LaundryCostPanelHandle>(null);

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
            className={laundryCompactOutlineButtonClass}
          >
            รีเซ็ต · เดือนนี้
          </button>
        : null}
      </div>
      <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {rangeLabel}</p>
    </div>
  );

  const net = periodTotalRevenue - periodTotalCost;

  return (
    <div className={laundryPanelClass}>
      <div className={laundryPanelSectionClass}>
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">การเงิน</h2>
          <div
            className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
            role="group"
            aria-label="เครื่องมือการเงิน"
          >
            <nav className={laundryInlineSubNavShellClass} role="tablist" aria-label="รายรับหรือรายจ่าย">
              <button
                type="button"
                role="tab"
                aria-selected={activeListTab === "sales"}
                title="รายรับ"
                aria-label="รายรับ"
                className={laundryInlineSubNavBtnClass(activeListTab === "sales")}
                onClick={() => setActiveListTab("sales")}
              >
                <span className="hidden sm:inline">รายรับ</span>
                <span className="sm:hidden" aria-hidden>
                  รับ
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeListTab === "costs"}
                title="รายจ่าย"
                aria-label="รายจ่าย"
                className={laundryInlineSubNavBtnClass(activeListTab === "costs")}
                onClick={() => setActiveListTab("costs")}
              >
                <span className="hidden sm:inline">รายจ่าย</span>
                <span className="sm:hidden" aria-hidden>
                  จ่าย
                </span>
              </button>
            </nav>
            {activeListTab === "sales" ?
              <div className={laundryInlineSubNavShellClass}>
                <button
                  type="button"
                  className={laundryInlineSubNavBtnClass(false)}
                  title="บันทึกรายรับเพิ่ม"
                  aria-label="บันทึกรายรับเพิ่ม"
                  onClick={() => {
                    if (revenueCategories.length === 0) {
                      revenuePanelRef.current?.openManageCategories();
                      return;
                    }
                    revenuePanelRef.current?.openAddEntry();
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="hidden sm:inline">รายรับเพิ่ม</span>
                </button>
              </div>
            : <div className={laundryInlineSubNavShellClass}>
                <button
                  type="button"
                  className={laundryInlineSubNavBtnClass(false)}
                  title="บันทึกรายจ่าย"
                  aria-label="บันทึกรายจ่าย"
                  onClick={() => {
                    if (costCategories.length === 0) {
                      costPanelRef.current?.openManageCategories();
                      return;
                    }
                    costPanelRef.current?.openAddEntry();
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="hidden sm:inline">รายจ่ายเพิ่ม</span>
                </button>
              </div>
            }
            <span className="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />
            <div className={laundryInlineSubNavShellClass}>
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="laundry-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  laundryInlineSubNavBtnClass(filterOpen),
                  "relative",
                  filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
                )}
              >
                <IconFilter className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ?
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                    aria-hidden
                  />
                : null}
              </button>
              <button
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="laundry-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={laundryInlineSubNavBtnClass(chartsOpen)}
              >
                <IconChart className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
              </button>
              <LaundryRefreshButton
                variant="inline"
                refreshing={historyLoading}
                onClick={() => void Promise.all([fetchHistory(), onRefresh()])}
                ariaLabel="รีเฟรชข้อมูลรายงาน"
              />
            </div>
          </div>
        </div>

        <ul className={cn(laundryFinanceStatsGridClass, "mt-4")} aria-label={`สรุปการเงิน ${rangeLabel}`}>
          <li className={cn(laundryStatInlineClass, "border-l-[3px] border-l-emerald-500")}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">รายรับ</p>
            <p className="text-lg font-black tabular-nums text-emerald-700 sm:text-xl">
              ฿{periodTotalRevenue.toLocaleString("th-TH")}
            </p>
          </li>
          <li className={cn(laundryStatInlineClass, "border-l-[3px] border-l-rose-500")}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600/80">รายจ่าย</p>
            <p className="text-lg font-black tabular-nums text-rose-600 sm:text-xl">
              ฿{periodTotalCost.toLocaleString("th-TH")}
            </p>
          </li>
          <li
            className={cn(
              laundryStatInlineClass,
              laundryFinanceStatTailClass,
              "border-l-[3px]",
              net >= 0 ? "border-l-slate-400" : "border-l-rose-500",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">สุทธิ</p>
            <p
              className={cn(
                "text-lg font-black tabular-nums sm:text-xl",
                net >= 0 ? "text-[#1e1b4b]" : "text-rose-800",
              )}
            >
              ฿{net.toLocaleString("th-TH")}
            </p>
          </li>
        </ul>

        <div id="laundry-finance-filter-panel" className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}>
          {filterPanel}
        </div>

        {chartsOpen ?
          <div id="laundry-finance-charts" className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3 sm:p-4">
              <h3 className={cn(laundrySectionHeadingClass, "mb-2")}>แนวโน้มรายรับ–รายจ่าย</h3>
              <AppRevenueCostColumnChart
                className="flex min-h-0 flex-1 flex-col"
                compact
                buckets={revenueCostBuckets}
                title=""
                emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
                formatTitle={(b) =>
                  `${b.label}: รายรับ ฿${b.revenue.toLocaleString("th-TH")} · รายจ่าย ฿${b.cost.toLocaleString("th-TH")}`
                }
              />
            </div>
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3 sm:p-4">
              <h3 className={laundrySectionHeadingClass}>สัดส่วนตามแพ็กเกจ</h3>
              {packageCompareRows.length > 0 ?
                <div className="mt-3 flex items-center gap-4">
                  <div
                    className="h-16 w-16 shrink-0 rounded-full ring-2 ring-slate-100 sm:h-20 sm:w-20"
                    style={{ background: donutGradientFromRows(packageCompareRows) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {packageCompareRows.slice(0, 4).map((row) => (
                      <div key={row.key} className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                        <span className="truncate font-medium text-[#66638c]">{row.label}</span>
                        <span className="shrink-0 font-bold tabular-nums text-emerald-700">
                          ฿{row.amount.toLocaleString("th-TH")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              : <p className="mt-3 text-center text-xs text-[#66638c]">ไม่มีข้อมูล</p>}
            </div>
          </div>
        : null}
      </div>

      <div className={cn(laundryPanelSectionClass, laundryPanelDividerClass)}>
        {activeListTab === "sales" ?
          <LaundryServiceHistoryList
            logs={filteredHistoryLogs}
            orders={filteredOrdersBase}
            revenueEntries={filteredRevenueEntries}
            baseUrl={baseUrl}
            loading={historyLoading}
            error={historyError}
            onRefresh={async () => {
              await Promise.all([fetchHistory(), onRefresh()]);
            }}
            onViewOrder={onViewOrder}
            onEditOrder={onEditOrder}
            onDeleteOrder={onDeleteOrder}
            onEditRevenue={(e) => revenuePanelRef.current?.openEditEntry(e)}
          />
        : <LaundryCostPanel
            ref={costPanelRef}
            hideToolbar
            repo={repo}
            baseUrl={baseUrl}
            categories={costCategories}
            entries={filteredCostEntries}
            onRefresh={onRefresh}
          />
        }
      </div>

      <LaundryRevenuePanel
        ref={revenuePanelRef}
        modalsOnly
        repo={repo}
        baseUrl={baseUrl}
        categories={revenueCategories}
        entries={filteredRevenueEntries}
        onRefresh={async () => {
          await Promise.all([fetchHistory(), onRefresh()]);
        }}
      />
    </div>
  );
}

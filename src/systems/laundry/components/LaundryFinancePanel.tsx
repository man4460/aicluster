"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppRevenueCostColumnChart,
  type AppCompareBarRow,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { HomeFinanceListHeading } from "@/systems/home-finance/components/HomeFinanceUi";
import { LaundryCostPanel } from "@/systems/laundry/components/LaundryCostPanel";
import { LaundryOrderCard } from "@/systems/laundry/components/LaundryOrderCard";
import { laundryDashboardCardGridClass } from "@/systems/laundry/laundry-dashboard-layout";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryCostCategory,
  type LaundryCostEntry,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryRepository,
} from "@/systems/laundry/laundry-service";

const MAX_COMPARE_ROWS = 18;

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

function getBangkokDateFilterDefaults(): { year: string; month: string; day: string } {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [y, mRaw, dRaw] = key.split("-");
  return {
    year: y ?? "",
    month: mRaw ? String(Number(mRaw)) : "",
    day: dRaw ? String(Number(dRaw)) : "",
  };
}

function orderDateKeyBangkok(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function orderPartsBangkok(iso: string): { y: number; m: number; d: number } {
  const key = orderDateKeyBangkok(iso);
  const [y, m, d] = key.split("-").map((x) => Number(x));
  return { y, m, d };
}

function matchesPeriod(iso: string, year: string, month: string, day: string): boolean {
  const { y, m, d } = orderPartsBangkok(iso);
  if (year) {
    const yN = Number(year);
    if (!Number.isFinite(yN) || y !== yN) return false;
  }
  if (month) {
    const mN = Number(month);
    if (!Number.isFinite(mN) || m !== mN) return false;
  }
  if (day) {
    const dN = Number(day);
    if (!Number.isFinite(dN) || d !== dN) return false;
  }
  return true;
}

function maxDayInMonthForFilter(yearStr: string, monthStr: string): number {
  const m = Number(monthStr);
  if (!monthStr || !Number.isFinite(m) || m < 1 || m > 12) return 31;
  const y =
    yearStr && Number.isFinite(Number(yearStr)) && Number(yearStr) >= 1900
      ? Number(yearStr)
      : 2024;
  return new Date(y, m, 0).getDate();
}

function matchesSearchOrder(o: LaundryOrder, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [o.customer_name, o.customer_phone, o.package_name, o.pickup_address, o.note, o.recorded_by_name]
    .join(" ")
    .toLowerCase();
  return blob.includes(s);
}

function matchesSearchCostEntry(e: LaundryCostEntry, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [e.category_name, e.item_label, e.note].join(" ").toLowerCase();
  return blob.includes(s);
}

function formatChartLabel(isoDateKey: string): string {
  const p = isoDateKey.split("-").map(Number);
  const d = p[2] ?? 0;
  const m = p[1] ?? 0;
  return `${d}/${m}`;
}

function orderCountsTowardRevenue(o: LaundryOrder): boolean {
  return o.status !== "CANCELLED";
}

export function LaundryFinancePanel({
  orders,
  costCategories,
  costEntries,
  repo,
  baseUrl,
  onRefresh,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
}: {
  orders: LaundryOrder[];
  costCategories: LaundryCostCategory[];
  costEntries: LaundryCostEntry[];
  repo: LaundryRepository;
  baseUrl: string;
  onRefresh: () => Promise<void>;
  onViewOrder: (o: LaundryOrder) => void;
  onEditOrder: (o: LaundryOrder) => void;
  onDeleteOrder: (o: LaundryOrder) => void | Promise<void>;
  onStatusChange: (id: number, status: LaundryOrderStatus) => void | Promise<void>;
}) {
  const bangkokFilterDefaults = useMemo(() => getBangkokDateFilterDefaults(), []);
  const [filterYear, setFilterYear] = useState(bangkokFilterDefaults.year);
  const [filterMonth, setFilterMonth] = useState(bangkokFilterDefaults.month);
  const [filterDay, setFilterDay] = useState("");
  const [search, setSearch] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeListTab, setActiveListTab] = useState<"sales" | "costs">("sales");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | LaundryOrderStatus>("all");

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    const nowKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    ys.add(Number(nowKey.slice(0, 4)));
    orders.forEach((o) => ys.add(orderPartsBangkok(o.order_at).y));
    costEntries.forEach((e) => ys.add(orderPartsBangkok(e.spent_at).y));
    return Array.from(ys).sort((a, b) => b - a);
  }, [orders, costEntries]);

  const dayNumbers = useMemo(() => {
    const max = maxDayInMonthForFilter(filterYear, filterMonth);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (!filterDay) return;
    const max = maxDayInMonthForFilter(filterYear, filterMonth);
    if (Number(filterDay) > max) setFilterDay("");
  }, [filterYear, filterMonth, filterDay]);

  const filteredOrdersBase = useMemo(() => {
    return orders.filter(
      (o) => matchesPeriod(o.order_at, filterYear, filterMonth, filterDay) && matchesSearchOrder(o, search),
    );
  }, [orders, filterYear, filterMonth, filterDay, search]);

  const filteredOrdersForRevenue = useMemo(() => {
    return filteredOrdersBase.filter(orderCountsTowardRevenue);
  }, [filteredOrdersBase]);

  const filteredOrdersList = useMemo(() => {
    if (orderStatusFilter === "all") return filteredOrdersBase;
    return filteredOrdersBase.filter((o) => o.status === orderStatusFilter);
  }, [filteredOrdersBase, orderStatusFilter]);

  const filteredCostEntries = useMemo(() => {
    return costEntries.filter(
      (e) => matchesPeriod(e.spent_at, filterYear, filterMonth, filterDay) && matchesSearchCostEntry(e, search),
    );
  }, [costEntries, filterYear, filterMonth, filterDay, search]);

  const revenueCostBuckets = useMemo(() => {
    const revenueByDay = new Map<string, number>();
    for (const o of filteredOrdersForRevenue) {
      const k = orderDateKeyBangkok(o.order_at);
      revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + o.final_price);
    }
    const costByDay = new Map<string, number>();
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
  }, [filteredOrdersForRevenue, filteredCostEntries]);

  const periodTotalRevenue = useMemo(
    () => filteredOrdersForRevenue.reduce((s, o) => s + o.final_price, 0),
    [filteredOrdersForRevenue],
  );

  const periodTotalCost = useMemo(() => filteredCostEntries.reduce((a, e) => a + e.amount, 0), [filteredCostEntries]);

  const packageCompareRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const o of filteredOrdersForRevenue) {
      const label = o.package_name.trim() || "ไม่ระบุแพ็กเกจ";
      totals.set(label, (totals.get(label) ?? 0) + o.final_price);
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return entriesToBarRows(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [filteredOrdersForRevenue]);

  const filterFields = (
    <div className="grid flex-1 grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="lf-y">
          ปี
        </label>
        <select
          id="lf-y"
          className="app-input w-full min-h-[40px] rounded-xl text-sm font-semibold"
          value={filterYear}
          onChange={(e) => {
            setFilterYear(e.target.value);
            setFilterMonth("");
            setFilterDay("");
          }}
        >
          <option value="">ทั้งหมด</option>
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="lf-m">
          เดือน
        </label>
        <select
          id="lf-m"
          className="app-input w-full min-h-[40px] rounded-xl text-sm font-semibold"
          value={filterMonth}
          onChange={(e) => {
            setFilterMonth(e.target.value);
            setFilterDay("");
          }}
        >
          <option value="">ทุกเดือน</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={String(m)}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="lf-d">
          วัน
        </label>
        <select
          id="lf-d"
          className="app-input w-full min-h-[40px] rounded-xl text-sm font-semibold"
          value={dayNumbers.includes(Number(filterDay)) ? filterDay : ""}
          onChange={(e) => setFilterDay(e.target.value)}
        >
          <option value="">ทุกวัน</option>
          {dayNumbers.map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="lf-s">
          ค้นหา
        </label>
        <input
          id="lf-s"
          className="app-input w-full min-h-[40px] rounded-xl text-sm font-semibold placeholder:text-slate-400"
          placeholder="ชื่อ, เบอร์, แพ็กเกจ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/55 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#1e1b4b]">ภาพรวมการเงิน</h2>
            <p className="text-xs font-medium text-slate-600">รายได้จากงานบริการและต้นทุน / รายจ่าย — เทียบโครงคาร์แคร์</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/55 text-violet-600 shadow-sm backdrop-blur-md transition-all active:scale-95 md:hidden"
            onClick={() => setMobileFilterOpen(true)}
            aria-label="เปิดตัวกรอง"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        <div className="mt-5 hidden rounded-2xl border border-white/55 bg-white/30 p-3 backdrop-blur-xl md:flex md:items-end md:gap-3">
          {filterFields}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-4">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 via-violet-50/35 to-indigo-100/30 p-3 shadow-[0_16px_34px_-24px_rgba(91,97,255,0.4)] backdrop-blur-xl sm:p-5">
            <span className="truncate text-[8px] font-bold uppercase tracking-wider text-violet-500 sm:text-[10px]">
              รายได้รวม
            </span>
            <p className="mt-2 text-sm font-black text-[#1e1b4b] sm:mt-3 sm:text-2xl">
              ฿{periodTotalRevenue.toLocaleString("th-TH")}
            </p>
          </div>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 via-rose-50/30 to-orange-100/25 p-3 shadow-[0_16px_34px_-24px_rgba(244,63,94,0.35)] backdrop-blur-xl sm:p-5">
            <span className="truncate text-[8px] font-bold uppercase tracking-wider text-rose-500 sm:text-[10px]">
              รายจ่ายรวม
            </span>
            <p className="mt-2 text-sm font-black text-rose-900 sm:mt-3 sm:text-2xl">
              ฿{periodTotalCost.toLocaleString("th-TH")}
            </p>
          </div>
          <div
            className={cn(
              "relative col-span-2 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 p-3 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.32)] backdrop-blur-xl sm:p-5",
              periodTotalRevenue - periodTotalCost >= 0 ?
                "bg-gradient-to-br from-white/60 to-emerald-100/28"
              : "bg-gradient-to-br from-white/60 to-orange-100/28",
            )}
          >
            <span
              className={cn(
                "truncate text-[8px] font-bold uppercase tracking-wider sm:text-[10px]",
                periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-600" : "text-orange-600",
              )}
            >
              กำไรสุทธิ
            </span>
            <p
              className={cn(
                "mt-2 text-sm font-black sm:mt-3 sm:text-2xl",
                periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-900" : "text-orange-900",
              )}
            >
              ฿{(periodTotalRevenue - periodTotalCost).toLocaleString("th-TH")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
            <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-sm font-black text-[#1e1b4b] sm:text-base">แนวโน้มรายได้และรายจ่าย</h3>
            </div>
            <div className="h-[200px] w-full sm:h-[260px]">
              <AppRevenueCostColumnChart
                className="h-full w-full"
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
            <h3 className="text-xs font-black text-[#1e1b4b] sm:text-sm">สัดส่วนตามแพ็กเกจ (รายได้)</h3>
            {packageCompareRows.length > 0 ?
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="h-16 w-16 shrink-0 rounded-full ring-4 ring-slate-50 sm:h-20 sm:w-20"
                  style={{ background: donutGradientFromRows(packageCompareRows) }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  {packageCompareRows.slice(0, 4).map((row, idx) => (
                    <div key={row.key} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="truncate font-medium text-slate-500">
                        <span
                          className={cn(
                            "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                            idx === 0 ? "bg-[#5b61ff]"
                            : idx === 1 ? "bg-[#8d64ff]"
                            : idx === 2 ? "bg-[#f06dc8]"
                            : "bg-[#22c55e]",
                          )}
                          aria-hidden
                        />
                        {row.label}
                      </span>
                      <span className="font-bold text-[#1e1b4b]">฿{row.amount.toLocaleString("th-TH")}</span>
                    </div>
                  ))}
                </div>
              </div>
            : <p className="mt-4 text-center text-[10px] text-slate-400">ไม่มีข้อมูล</p>}
          </div>
        </div>
      </AppDashboardSection>

      <FormModal
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="ตัวกรองการเงิน"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setMobileFilterOpen(false)}
            onSubmit={() => setMobileFilterOpen(false)}
            submitLabel="ปิด"
          />
        }
      >
        <div className="space-y-4">{filterFields}</div>
      </FormModal>

      <AppDashboardSection tone="slate">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/55 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <HomeFinanceListHeading className="mb-0">
              {activeListTab === "sales" ? "ประวัติการให้บริการ (รายรับ)" : "ต้นทุน / รายจ่าย"}
            </HomeFinanceListHeading>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {activeListTab === "sales" ?
                `รวม ${filteredOrdersList.length} รายการในช่วงที่กรอง`
              : `รวม ${filteredCostEntries.length} รายการ`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-xl border border-white/60 bg-white/40 p-1 backdrop-blur-md">
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeListTab === "sales" ?
                  "bg-white/80 text-[#5b61ff] shadow-sm ring-1 ring-white/80"
                : "text-slate-600 hover:bg-white/55 hover:text-slate-800",
              )}
              onClick={() => setActiveListTab("sales")}
            >
              รายรับ
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeListTab === "costs" ?
                  "bg-white/80 text-rose-600 shadow-sm ring-1 ring-white/80"
                : "text-slate-600 hover:bg-white/55 hover:text-slate-800",
              )}
              onClick={() => setActiveListTab("costs")}
            >
              รายจ่าย
            </button>
          </div>
        </div>

        {activeListTab === "sales" ?
          <div className="mt-4 space-y-3">
            <label className="text-xs font-semibold text-slate-600">
              กรองตามสถานะงาน
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
              <AppEmptyState tone="glass">ไม่พบรายการตามเงื่อนไข</AppEmptyState>
            : <ul className={cn(laundryDashboardCardGridClass, "list-none p-0")} aria-label="ประวัติงานซักผ้า">
                {filteredOrdersList.map((o) => (
                  <li key={o.id} className="min-w-0">
                    <LaundryOrderCard
                      order={o}
                      tone="slate"
                      showStatusSelect={false}
                      showOrderedAt
                      onView={() => onViewOrder(o)}
                      onEdit={() => onEditOrder(o)}
                      onDelete={() => void onDeleteOrder(o)}
                      onStatusChange={onStatusChange}
                    />
                  </li>
                ))}
              </ul>
            }
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

"use client";

import Link from "next/link";
import { ArrowUpRight, FolderOpen, MonitorSmartphone, Scale, Store } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppColumnBarDualSparkChart,
  AppColumnBarSparkChart,
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appDashboardInnerScrollClass,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import { ecommerceDecimalToBahtNumber, formatEcommerceBaht } from "@/lib/ecommerce/sales-period";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  EcommerceCostsPanel,
  type EcommerceCostCategoryRow,
  type EcommerceCostEntryRow,
  type EcommerceCostsPanelHandle,
} from "@/systems/ecommerce-store/components/EcommerceCostsPanel";
import { EcommerceStoreButton } from "@/systems/ecommerce-store/components/EcommerceStoreButton";
import {
  ecommerceSalesChannelLabel,
  ecommercePosPaymentMethodLabel,
} from "@/systems/ecommerce-store/lib/sales-channel";
import {
  ecommerceStoreContentStackClass,
  ecommerceStoreFieldClass,
  ecommerceStoreFinanceRangeChipClass,
  ecommerceStoreFinanceStatInlineClass,
  ecommerceStoreFinanceStatsGridClass,
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
  ecommerceStoreNavDividerClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStoreSectionHeadingClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { ecommerceProductTagClass } from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";
type DetailPanel = "history" | "expenses";

type FinanceBucket = {
  dateKey: string;
  label: string;
  revenueBaht: number;
  onlineRevenueBaht?: number;
  inStoreRevenueBaht?: number;
  costBaht: number;
};

type OrderRow = {
  id: string;
  referenceCode: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  totalAmount: unknown;
  paymentSlipUrl: string | null;
  paymentMethod?: string | null;
  salesChannel?: "ONLINE" | "IN_STORE";
  status: keyof typeof ECOMMERCE_ORDER_STATUS_LABELS;
  createdAt: string;
  items?: { productName: string }[];
};

function bangkokDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function bangkokTodayKey(): string {
  return new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function dateKeyInFinanceRange(
  day: string,
  range: FinanceRange,
  today: string,
  startDate: string,
  endDate: string,
): boolean {
  if (!day) return false;
  if (range === "TODAY") return day === today;
  if (range === "MONTH") return day.slice(0, 7) === today.slice(0, 7);
  if (range === "YEAR") return day.slice(0, 4) === today.slice(0, 4);
  const rawStart = startDate || endDate;
  const rawEnd = endDate || startDate;
  const start = rawStart && rawEnd && rawStart > rawEnd ? rawEnd : rawStart;
  const end = rawStart && rawEnd && rawStart > rawEnd ? rawStart : rawEnd;
  if (!start && !end) return true;
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function formatOrderAt(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
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

const filterFieldClass = ecommerceStoreFieldClass;
const filterResetButtonClass = ecommerceStoreOutlineButtonClass;

export function EcommerceFinanceClient() {
  const notice = useAppNoticePopup();
  const slipLb = useAppImageLightbox();
  const costsPanelRef = useRef<EcommerceCostsPanelHandle>(null);
  const todayKey = bangkokTodayKey();

  const [financeRange, setFinanceRange] = useState<FinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [detailPanel, setDetailPanel] = useState<DetailPanel>("history");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financeBuckets, setFinanceBuckets] = useState<FinanceBucket[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOnlineRevenue, setTotalOnlineRevenue] = useState(0);
  const [totalInStoreRevenue, setTotalInStoreRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [financeRangeLabel, setFinanceRangeLabel] = useState("เดือนนี้");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [costs, setCosts] = useState<EcommerceCostEntryRow[]>([]);
  const [categories, setCategories] = useState<EcommerceCostCategoryRow[]>([]);

  const filtersActive =
    financeRange !== "MONTH" || Boolean(dateFrom.trim() || dateTo.trim() || keyword.trim());

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ range: financeRange });
      if (financeRange === "CUSTOM") {
        if (dateFrom.trim()) params.set("from", dateFrom.trim());
        if (dateTo.trim()) params.set("to", dateTo.trim());
      }
      const [sumRes, ordRes, costRes, catRes] = await Promise.all([
        fetch(`/api/ecommerce-store/session/finance-summary?${params}`, { credentials: "include" }),
        fetch("/api/ecommerce-store/session/orders", { credentials: "include" }),
        fetch("/api/ecommerce-store/session/costs", { credentials: "include" }),
        fetch("/api/ecommerce-store/session/cost-categories", { credentials: "include" }),
      ]);
      const sumJ = (await sumRes.json().catch(() => ({}))) as {
        error?: string;
        buckets?: FinanceBucket[];
        totalRevenue?: number;
        totalOnlineRevenue?: number;
        totalInStoreRevenue?: number;
        totalCost?: number;
        rangeLabel?: string;
      };
      const ordJ = (await ordRes.json().catch(() => ({}))) as { orders?: OrderRow[]; error?: string };
      const costJ = (await costRes.json().catch(() => ({}))) as {
        costs?: EcommerceCostEntryRow[];
        error?: string;
      };
      const catJ = (await catRes.json().catch(() => ({}))) as {
        categories?: EcommerceCostCategoryRow[];
        error?: string;
      };
      if (!sumRes.ok) throw new Error(sumJ.error ?? "โหลดสรุปการเงินไม่สำเร็จ");
      if (!ordRes.ok) throw new Error(ordJ.error ?? "โหลดออเดอร์ไม่สำเร็จ");
      if (!costRes.ok) throw new Error(costJ.error ?? "โหลดรายจ่ายไม่สำเร็จ");
      if (!catRes.ok) throw new Error(catJ.error ?? "โหลดหมวดรายจ่ายไม่สำเร็จ");

      setFinanceBuckets(sumJ.buckets ?? []);
      setTotalRevenue(sumJ.totalRevenue ?? 0);
      setTotalOnlineRevenue(sumJ.totalOnlineRevenue ?? 0);
      setTotalInStoreRevenue(sumJ.totalInStoreRevenue ?? 0);
      setTotalCost(sumJ.totalCost ?? 0);
      setFinanceRangeLabel(sumJ.rangeLabel ?? "เดือนนี้");
      setOrders(ordJ.orders ?? []);
      setCosts(costJ.costs ?? []);
      setCategories(catJ.categories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [financeRange, dateFrom, dateTo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const kwDigits = keyword.replace(/\D/g, "");
    return orders.filter((o) => {
      const day = bangkokDateKey(o.createdAt);
      if (!dateKeyInFinanceRange(day, financeRange, todayKey, dateFrom.trim(), dateTo.trim())) {
        return false;
      }
      if (kw) {
        const phoneDigits = (o.customerPhone ?? "").replace(/\D/g, "");
        const blob = [
          o.customerName,
          o.customerPhone,
          o.referenceCode,
          o.trackingCode,
          ...(o.items ?? []).map((i) => i.productName),
        ]
          .join(" ")
          .toLowerCase();
        const textMatch = blob.includes(kw);
        const phoneMatch = kwDigits.length >= 3 && phoneDigits.includes(kwDigits);
        if (!textMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [orders, keyword, financeRange, todayKey, dateFrom, dateTo]);

  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      const day = bangkokDateKey(c.spentAt);
      return dateKeyInFinanceRange(day, financeRange, todayKey, dateFrom.trim(), dateTo.trim());
    });
  }, [costs, financeRange, todayKey, dateFrom, dateTo]);

  const { chartBuckets, chartPeriodTotalBaht } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of financeBuckets) totals.set(b.dateKey, 0);
    for (const o of filteredOrders) {
      const day = bangkokDateKey(o.createdAt);
      if (!day) continue;
      const key = financeRange === "YEAR" ? day.slice(0, 7) : day;
      if (totals.has(key)) {
        totals.set(key, (totals.get(key) ?? 0) + ecommerceDecimalToBahtNumber(o.totalAmount as never));
      }
    }
    const max = Math.max(1, ...[...totals.values()]);
    const buckets = financeBuckets.map((b) => {
      const amount = totals.get(b.dateKey) ?? b.revenueBaht;
      return { key: b.dateKey, label: b.label, amount, pct: (amount / max) * 100 };
    });
    const total = buckets.reduce((acc, b) => acc + b.amount, 0);
    return { chartBuckets: buckets, chartPeriodTotalBaht: total };
  }, [filteredOrders, financeBuckets, financeRange]);

  const revenueCostChartBuckets = useMemo(() => {
    const max = Math.max(1, ...financeBuckets.map((b) => Math.max(b.revenueBaht, b.costBaht)));
    return financeBuckets.map((b) => ({
      key: b.dateKey,
      label: b.label,
      revenue: b.revenueBaht,
      cost: b.costBaht,
      revenuePct: (b.revenueBaht / max) * 100,
      costPct: (b.costBaht / max) * 100,
    }));
  }, [financeBuckets]);

  const channelChartBuckets = useMemo(() => {
    const max = Math.max(
      1,
      ...financeBuckets.map((b) =>
        Math.max(b.onlineRevenueBaht ?? 0, b.inStoreRevenueBaht ?? 0),
      ),
    );
    return financeBuckets.map((b) => {
      const online = b.onlineRevenueBaht ?? 0;
      const inStore = b.inStoreRevenueBaht ?? 0;
      return {
        key: b.dateKey,
        label: b.label,
        seriesA: { amount: online, pct: (online / max) * 100 },
        seriesB: { amount: inStore, pct: (inStore / max) * 100 },
      };
    });
  }, [financeBuckets]);

  function resetFilters() {
    setKeyword("");
    setFinanceRange("MONTH");
    setDateFrom("");
    setDateTo("");
  }

  function selectFinanceRange(next: FinanceRange) {
    setFinanceRange(next);
    if (next !== "CUSTOM") {
      setDateFrom("");
      setDateTo("");
    }
  }

  async function deleteOrder(o: OrderRow) {
    const baht = formatEcommerceBaht(ecommerceDecimalToBahtNumber(o.totalAmount as never));
    const ok = await notice.confirm(`ลบออเดอร์ ${o.referenceCode} ฿${baht} ใช่หรือไม่?`);
    if (!ok) return;
    try {
      const res = await fetch("/api/ecommerce-store/session/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: o.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "ลบไม่สำเร็จ");
      await reload();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  const profitTotal = totalRevenue - totalCost;

  return (
    <div className={ecommerceStoreContentStackClass}>
      {notice.popup}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div
              className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
              role="group"
              aria-label="เครื่องมือการเงิน"
            >
              <nav className={ecommerceStoreInlineSubNavShellClass} role="tablist" aria-label="รายรับหรือรายจ่าย">
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailPanel === "history"}
                  id="ecommerce-finance-tab-history"
                  aria-controls="ecommerce-finance-panel-history"
                  title="รายรับ"
                  aria-label="รายรับ"
                  className={ecommerceStoreInlineSubNavBtnClass(detailPanel === "history")}
                  onClick={() => setDetailPanel("history")}
                >
                  <span className="hidden sm:inline">รายรับ</span>
                  <span className="sm:hidden" aria-hidden>
                    รับ
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailPanel === "expenses"}
                  id="ecommerce-finance-tab-expenses"
                  aria-controls="ecommerce-finance-panel-expenses"
                  title="รายจ่าย"
                  aria-label="รายจ่าย"
                  className={ecommerceStoreInlineSubNavBtnClass(detailPanel === "expenses")}
                  onClick={() => setDetailPanel("expenses")}
                >
                  <span className="hidden sm:inline">รายจ่าย</span>
                  <span className="sm:hidden" aria-hidden>
                    จ่าย
                  </span>
                </button>
              </nav>
              {detailPanel === "history" ? (
                <div className={ecommerceStoreInlineSubNavShellClass}>
                  <Link
                    href="/dashboard/ecommerce-store?tab=orders"
                    className={ecommerceStoreInlineSubNavBtnClass(false)}
                    title="ไปหน้าออเดอร์"
                    aria-label="ไปหน้าออเดอร์"
                  >
                    <span className="hidden sm:inline">ออเดอร์</span>
                    <span className="sm:hidden" aria-hidden>
                      ออเดอร์
                    </span>
                  </Link>
                </div>
              ) : (
                <>
                  <div className={ecommerceStoreInlineSubNavShellClass}>
                    <button
                      type="button"
                      className={ecommerceStoreInlineSubNavBtnClass(false)}
                      title="จัดการหมวดหมู่"
                      aria-label="จัดการหมวดหมู่รายจ่าย"
                      onClick={() => costsPanelRef.current?.openManageCategories()}
                    >
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">หมวดหมู่</span>
                    </button>
                  </div>
                  <div className={ecommerceStoreInlineSubNavShellClass}>
                    <button
                      type="button"
                      className={ecommerceStoreInlineSubNavBtnClass(false)}
                      title="บันทึกรายจ่าย"
                      aria-label="บันทึกรายจ่าย"
                      onClick={() => {
                        if (categories.length === 0) {
                          costsPanelRef.current?.openManageCategories();
                          return;
                        }
                        costsPanelRef.current?.openAddEntry();
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="hidden sm:inline">รายจ่ายเพิ่ม</span>
                    </button>
                  </div>
                </>
              )}
              <span className={ecommerceStoreNavDividerClass} aria-hidden />
              <div className={ecommerceStoreInlineSubNavShellClass}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  aria-expanded={filterOpen}
                  aria-controls="ecommerce-finance-filter-panel"
                  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  className={cn(
                    ecommerceStoreInlineSubNavBtnClass(filterOpen),
                    "relative",
                    filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
                  )}
                >
                  <IconFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                  {filtersActive ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setChartsOpen((o) => !o)}
                  aria-expanded={chartsOpen}
                  aria-controls="ecommerce-finance-charts"
                  aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                  title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                  className={ecommerceStoreInlineSubNavBtnClass(chartsOpen)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.25}
                    aria-hidden
                  >
                    <path d="M4 19V5M10 19V9M16 19v-6M22 19V7" strokeLinecap="round" />
                  </svg>
                  <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void reload()}
                  disabled={loading}
                  aria-busy={loading}
                  aria-label="รีเฟรชข้อมูลรายงาน"
                  title="รีเฟรช"
                  className={cn(ecommerceStoreInlineSubNavBtnClass(false), "disabled:opacity-50")}
                >
                  <IconRefresh className={cn("h-3.5 w-3.5 shrink-0", loading && "animate-spin")} />
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>
              </div>
            </div>
          }
        />

        <ul
          className={cn(ecommerceStoreFinanceStatsGridClass, "mt-4")}
          aria-label={`สรุปการเงิน ${financeRangeLabel}`}
        >
          <li
            className={cn(
              ecommerceStoreFinanceStatInlineClass,
              "border-l-[3px] border-l-sky-500 bg-sky-50/55",
            )}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800/80">
              <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden />
              ออนไลน์
            </div>
            <p className="text-lg font-black tabular-nums text-sky-800 sm:text-xl">
              ฿{formatEcommerceBaht(totalOnlineRevenue)}
            </p>
          </li>
          <li
            className={cn(
              ecommerceStoreFinanceStatInlineClass,
              "border-l-[3px] border-l-violet-500 bg-violet-50/50",
            )}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800/80">
              <Store className="h-3.5 w-3.5" aria-hidden />
              หน้าร้าน
            </div>
            <p className="text-lg font-black tabular-nums text-violet-800 sm:text-xl">
              ฿{formatEcommerceBaht(totalInStoreRevenue)}
            </p>
          </li>
          <li
            className={cn(
              ecommerceStoreFinanceStatInlineClass,
              "border-l-[3px] border-l-rose-500 bg-rose-50/55",
            )}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800/80">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              รายจ่าย
            </div>
            <p className="text-lg font-black tabular-nums text-rose-600 sm:text-xl">
              ฿{formatEcommerceBaht(totalCost)}
            </p>
          </li>
          <li
            className={cn(
              ecommerceStoreFinanceStatInlineClass,
              "border-l-[3px]",
              profitTotal >= 0
                ? "border-l-indigo-500 bg-indigo-50/50"
                : "border-l-rose-500 bg-rose-50/55",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide",
                profitTotal >= 0 ? "text-indigo-800/80" : "text-rose-800/80",
              )}
            >
              <Scale className="h-3.5 w-3.5" aria-hidden />
              สุทธิ · รวม ฿{formatEcommerceBaht(totalRevenue)}
            </div>
            <p
              className={cn(
                "text-lg font-black tabular-nums sm:text-xl",
                profitTotal < 0 ? "text-rose-800" : "text-[#1e1b4b]",
              )}
            >
              ฿{formatEcommerceBaht(profitTotal)}
            </p>
          </li>
        </ul>

        <div
          id="ecommerce-finance-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
            {(
              [
                ["TODAY", "วันนี้"],
                ["MONTH", "เดือนนี้"],
                ["YEAR", "ปีนี้"],
                ["CUSTOM", "กำหนดเอง"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => selectFinanceRange(key)}
                className={ecommerceStoreFinanceRangeChipClass(financeRange === key)}
                aria-pressed={financeRange === key}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {financeRange === "CUSTOM" ? (
              <>
                <label className="min-w-0 sm:w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="ตั้งแต่วันที่ กรุงเทพ"
                    className={cn(filterFieldClass, "mt-1")}
                  />
                </label>
                <label className="min-w-0 sm:w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="ถึงวันที่ กรุงเทพ"
                    className={cn(filterFieldClass, "mt-1")}
                  />
                </label>
              </>
            ) : null}
            <label className="min-w-0 flex-1 sm:min-w-[14rem]">
              <span className="sr-only">ค้นหาชื่อ เบอร์ หรือรหัสออเดอร์</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาชื่อ เบอร์ หรือรหัสออเดอร์…"
                aria-label="ค้นหาชื่อ เบอร์ หรือรหัสออเดอร์"
                inputMode="search"
                className={cn(filterFieldClass, "mt-0")}
              />
            </label>
            {filtersActive ? (
              <EcommerceStoreButton
                type="button"
                onClick={() => resetFilters()}
                className={filterResetButtonClass}
                aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
              >
                รีเซ็ต · เดือนนี้
              </EcommerceStoreButton>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel}</p>
        </div>

        {chartsOpen ? (
          <div id="ecommerce-finance-charts" className="mt-4 space-y-4">
            <p className="text-sm font-black text-[#1e1b4b]">รายรับเทียบรายจ่าย · {financeRangeLabel}</p>
            {loading ? (
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />
            ) : (
              <AppSparkChartPanel className="w-full min-w-0">
                <AppRevenueCostColumnChart
                  className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                  compact
                  title=""
                  subtitle=""
                  emptyText="ยังไม่มีข้อมูลในช่วงนี้"
                  buckets={revenueCostChartBuckets}
                  formatTitle={(b) =>
                    `${b.label}: รายรับ ฿${formatEcommerceBaht(b.revenue)} · รายจ่าย ฿${formatEcommerceBaht(b.cost)}`
                  }
                />
              </AppSparkChartPanel>
            )}

            <p className="text-sm font-black text-[#1e1b4b]">ออนไลน์ vs หน้าร้าน · {financeRangeLabel}</p>
            {loading ? (
              <div className="h-36 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />
            ) : (
              <AppSparkChartPanel className="w-full min-w-0">
                <AppColumnBarDualSparkChart
                  className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                  compact
                  titleTone="brand"
                  seriesALabel="ออนไลน์"
                  seriesBLabel="หน้าร้าน"
                  emptyText="ยังไม่มีข้อมูลช่องทางขาย"
                  buckets={channelChartBuckets}
                  formatGroupTitle={(b) =>
                    `${b.label}: ออนไลน์ ฿${formatEcommerceBaht(b.seriesA.amount)} · หน้าร้าน ฿${formatEcommerceBaht(b.seriesB.amount)}`
                  }
                />
              </AppSparkChartPanel>
            )}

            <p className="text-sm font-black text-[#1e1b4b]">ยอดขาย · {financeRangeLabel}</p>
            {loading ? (
              <div className="h-36 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
                <div className="min-h-[10rem] min-w-0 flex-1">
                  <AppColumnBarSparkChart
                    className="w-full"
                    buckets={chartBuckets}
                    emptyText="ยังไม่มียอดในช่วงนี้"
                    variant="brand"
                    compact
                    formatTitle={(b) => `${b.label}: ฿${formatEcommerceBaht(b.amount)}`}
                  />
                </div>
                <aside
                  className={cn(
                    "flex shrink-0 flex-col justify-center rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/70 via-white/50 to-violet-50/40 px-4 py-3 shadow-sm ring-1 ring-inset ring-white/45 sm:w-[11rem] sm:rounded-2xl sm:px-4 sm:py-4",
                    "sm:text-center",
                  )}
                  aria-label={`ยอดรวม ${financeRangeLabel} ฿${formatEcommerceBaht(chartPeriodTotalBaht)}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#66638c] sm:text-center">
                    รวม · {financeRangeLabel}
                  </p>
                  <p className="mt-1 text-2xl font-black leading-tight tabular-nums text-emerald-700 sm:text-center sm:text-3xl">
                    ฿{formatEcommerceBaht(chartPeriodTotalBaht)}
                  </p>
                </aside>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
          {detailPanel === "history" ? (
            <div
              id="ecommerce-finance-panel-history"
              role="tabpanel"
              aria-labelledby="ecommerce-finance-tab-history"
            >
              <h3 className={ecommerceStoreSectionHeadingClass}>
                ประวัติ / รายรับ
                <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#5f5a8a]">
                  {filteredOrders.length}
                </span>
              </h3>
              {loading ? (
                <div className="mt-3 h-32 animate-pulse rounded-2xl bg-slate-100/80" aria-hidden />
              ) : orders.length === 0 ? (
                <AppEmptyState tone="slate" className="mt-3">
                  ยังไม่มีออเดอร์
                </AppEmptyState>
              ) : filteredOrders.length === 0 ? (
                <AppEmptyState tone="slate" className="mt-3">
                  ไม่พบออเดอร์ตามตัวกรอง
                </AppEmptyState>
              ) : (
                <div
                  className={cn("mt-3 max-h-[min(70vh,44rem)] min-h-0", appDashboardInnerScrollClass)}
                  role="region"
                  aria-label="รายการออเดอร์รายรับ"
                >
                  <ul className="space-y-2 pr-0.5">
                    {filteredOrders.map((o) => {
                      const slip = o.paymentSlipUrl?.trim() || "";
                      const baht = ecommerceDecimalToBahtNumber(o.totalAmount as never);
                      return (
                        <li
                          key={o.id}
                          className="flex items-start gap-2 rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40"
                        >
                          {slip ? (
                            <AppImageThumb
                              src={slip}
                              alt={`สลิป ${o.referenceCode}`}
                              onOpen={() => slipLb.open(slip)}
                              className="h-14 w-14 shrink-0"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold tabular-nums text-[#66638c]">
                              {formatOrderAt(o.createdAt)}
                            </p>
                            <p className="mt-0.5 truncate text-sm font-black text-[#1e1b4b]">
                              {o.customerName}
                              <span className="ml-1 font-bold text-[#66638c]">· {o.referenceCode}</span>
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#4d47b6]">
                              <span
                                className={ecommerceProductTagClass(
                                  o.salesChannel === "IN_STORE" ? "violet" : "sky",
                                )}
                              >
                                {ecommerceSalesChannelLabel(o.salesChannel)}
                              </span>
                              <span>{ECOMMERCE_ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
                              {o.paymentMethod ? (
                                <span>· {ecommercePosPaymentMethodLabel(o.paymentMethod)}</span>
                              ) : null}
                              {o.customerPhone ? <span>· {o.customerPhone}</span> : null}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <p className="text-base font-black tabular-nums text-emerald-700">
                              ฿{formatEcommerceBaht(baht)}
                            </p>
                            <button
                              type="button"
                              className={assetRowRemoveIconButtonClass}
                              aria-label={`ลบออเดอร์ ${o.referenceCode}`}
                              title="ลบ"
                              onClick={() => void deleteOrder(o)}
                            >
                              <IconRowRemove className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div
              id="ecommerce-finance-panel-expenses"
              role="tabpanel"
              aria-labelledby="ecommerce-finance-tab-expenses"
            >
              <EcommerceCostsPanel
                ref={costsPanelRef}
                hideToolbar
                categories={categories}
                entries={filteredCosts}
                onChanged={() => void reload()}
                emptyWhenFilteredMessage="ไม่มีรายจ่ายในช่วงที่กรอง"
              />
            </div>
          )}
        </div>
      </AppDashboardSection>

      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปชำระเงิน" />
    </div>
  );
}

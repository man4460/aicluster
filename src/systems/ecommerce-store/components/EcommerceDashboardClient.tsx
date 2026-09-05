"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatEcommerceBaht } from "@/lib/ecommerce/sales-period";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ECOMMERCE_STORE_SETTINGS_PORTAL_HREF } from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  ecommerceStoreDashboardStatsGridClass,
  ecommerceStoreFilterChipShellClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePrimaryButtonClass,
  ecommerceStoreSectionHeadingClass,
  ecommerceStoreStatInlineClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type SalesPeriod = "today" | "month" | "year" | "custom";

type SalesSummary = {
  period: SalesPeriod;
  label: string;
  from: string;
  to: string;
  orderCount: number;
  totalBaht: number;
};

type Summary = {
  store: { id: string; storeName: string; merchantPaused: boolean };
  pendingOrders: number;
  lowStockCount: number;
  productCount: number;
};

const PERIOD_OPTIONS: { key: SalesPeriod; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "month", label: "เดือนนี้" },
  { key: "year", label: "ปีนี้" },
  { key: "custom", label: "ย้อนหลัง" },
];

const STAT_ACCENTS = {
  slate: "border-l-slate-400 text-slate-700",
  amber: "border-l-amber-500 text-amber-800",
  sky: "border-l-sky-500 text-sky-800",
  emerald: "border-l-emerald-500 text-emerald-800",
  rose: "border-l-rose-500 text-rose-800",
  indigo: "border-l-indigo-500 text-indigo-800",
} as const;

function OverviewStat({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: ReactNode;
  tone: keyof typeof STAT_ACCENTS;
  icon: ReactNode;
}) {
  return (
    <div className={cn(ecommerceStoreStatInlineClass, "w-full border-l-[3px]", STAT_ACCENTS[tone])}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-75">
        <span className="text-current opacity-80" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      <p className="text-lg font-bold tabular-nums sm:text-xl">{value}</p>
    </div>
  );
}

function periodChipClass(active: boolean) {
  return cn(
    "min-h-8 shrink-0 rounded-md px-2.5 text-xs font-bold leading-none transition sm:min-h-9 sm:px-3",
    active
      ? "bg-gradient-to-r from-[#0000BF] via-[#5b61ff] to-[#c026d3] text-white shadow-sm"
      : "border border-slate-200/90 bg-white text-[#5f5a8a] hover:bg-slate-50 hover:text-[#4d47b6]",
  );
}

export function EcommerceDashboardClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("today");
  const [customFrom, setCustomFrom] = useState(() => bangkokDateKey());
  const [customTo, setCustomTo] = useState(() => bangkokDateKey());
  const [customDraftFrom, setCustomDraftFrom] = useState(customFrom);
  const [customDraftTo, setCustomDraftTo] = useState(customTo);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [storeRes, prodRes, ordRes] = await Promise.all([
        fetch("/api/ecommerce-store/session/store"),
        fetch("/api/ecommerce-store/session/products"),
        fetch("/api/ecommerce-store/session/orders?status=PENDING_SLIP"),
      ]);
      const storeJ = await storeRes.json();
      const prodJ = await prodRes.json();
      const ordJ = await ordRes.json();
      const products = (prodJ.products ?? []) as { stockBalance: number }[];
      const threshold = prodJ.lowStockThreshold ?? 5;
      setData({
        store: storeJ.store,
        pendingOrders: (ordJ.orders ?? []).length,
        productCount: products.length,
        lowStockCount: products.filter((p) => p.stockBalance <= threshold).length,
      });
    })();
  }, []);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError(null);
    const params = new URLSearchParams({ period: salesPeriod });
    if (salesPeriod === "custom") {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    try {
      const res = await fetch(`/api/ecommerce-store/session/sales-summary?${params}`);
      const j = (await res.json()) as SalesSummary & { error?: string };
      if (!res.ok) {
        setSales(null);
        setSalesError(j.error ?? "โหลดยอดขายไม่สำเร็จ");
        return;
      }
      setSales(j);
    } catch {
      setSales(null);
      setSalesError("โหลดยอดขายไม่สำเร็จ");
    } finally {
      setSalesLoading(false);
    }
  }, [salesPeriod, customFrom, customTo]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  function applyCustomRange() {
    setCustomFrom(customDraftFrom);
    setCustomTo(customDraftTo);
  }

  const salesRangeHint =
    sales?.from && sales?.to
      ? sales.from === sales.to
        ? sales.from
        : `${sales.from} – ${sales.to}`
      : null;

  const storeOpen = data ? !data.store.merchantPaused : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className={ecommerceStoreSectionHeadingClass}>ยอดขาย · สถานะร้าน</h3>
          <p className="mt-0.5 hidden text-xs font-medium text-[#66638c] sm:block">
            {data?.store.storeName
              ? `${data.store.storeName} · เวลาไทย (กรุงเทพ)`
              : "สรุปตามช่วงเวลา (เวลาไทย)"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/dashboard/ecommerce-store?tab=orders"
            className={ecommerceStoreOutlineButtonClass}
            aria-label="ดูรายการออเดอร์"
          >
            ออเดอร์
          </Link>
          <Link
            href={ECOMMERCE_STORE_SETTINGS_PORTAL_HREF}
            className={ecommerceStoreOutlineButtonClass}
            aria-label="ไปตั้งค่าเว็ปลิงค์ลูกค้า"
          >
            ลิงก์ร้าน
          </Link>
        </div>
      </div>

      <div className={ecommerceStoreFilterChipShellClass} role="group" aria-label="ช่วงยอดขาย">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={periodChipClass(salesPeriod === p.key)}
            aria-pressed={salesPeriod === p.key}
            onClick={() => {
              if (p.key === "custom") {
                setCustomFrom(customDraftFrom);
                setCustomTo(customDraftTo);
                setSalesPeriod("custom");
                return;
              }
              setSalesPeriod(p.key);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {salesPeriod === "custom" ? (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-[#66638c]">
            ตั้งแต่
            <input
              type="date"
              value={customDraftFrom}
              onChange={(e) => setCustomDraftFrom(e.target.value)}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#1e1b4b]"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-[#66638c]">
            ถึง
            <input
              type="date"
              value={customDraftTo}
              onChange={(e) => setCustomDraftTo(e.target.value)}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#1e1b4b]"
            />
          </label>
          <button type="button" onClick={() => void applyCustomRange()} className={ecommerceStorePrimaryButtonClass}>
            ดูยอด
          </button>
        </div>
      ) : null}

      {salesError ? <p className="text-sm font-semibold text-rose-700">{salesError}</p> : null}

      {salesRangeHint || storeOpen != null ? (
        <p className="text-xs font-semibold text-[#66638c]">
          {sales?.label ? `${sales.label}` : null}
          {salesRangeHint ? ` · ${salesRangeHint}` : null}
          {storeOpen != null ? ` · ร้าน${storeOpen ? "เปิด" : "ปิดชั่วคราว"}` : null}
          {data ? ` · สินค้า ${data.productCount.toLocaleString("th-TH")} รายการ` : null}
        </p>
      ) : null}

      <div className={ecommerceStoreDashboardStatsGridClass}>
        <OverviewStat
          title="รายรับ"
          value={salesLoading ? "…" : `฿${formatEcommerceBaht(sales?.totalBaht ?? 0)}`}
          tone="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" strokeLinecap="round" />
            </svg>
          }
        />
        <OverviewStat
          title="ออเดอร์"
          value={salesLoading ? "—" : (sales?.orderCount ?? 0).toLocaleString("th-TH")}
          tone="indigo"
          icon={
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <rect x="5" y="4" width="14" height="17" rx="2" />
              <path d="M8 12h8M8 16h5" strokeLinecap="round" />
            </svg>
          }
        />
        <OverviewStat
          title="รอตรวจสลิป"
          value={(data?.pendingOrders ?? 0).toLocaleString("th-TH")}
          tone="amber"
          icon={
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
        />
        <OverviewStat
          title="ใกล้หมดสต๊อก"
          value={(data?.lowStockCount ?? 0).toLocaleString("th-TH")}
          tone="rose"
          icon={
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
}

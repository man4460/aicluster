"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ecommercePublicShopUrl } from "@/lib/ecommerce/constants";
import { formatEcommerceBaht } from "@/lib/ecommerce/sales-period";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { IconCopy } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

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

const periodChipClass = (active: boolean) =>
  cn(
    "min-h-[40px] shrink-0 rounded-xl border px-3 text-sm font-semibold transition-colors",
    active
      ? "border-[#5b61ff]/40 bg-[#5b61ff] text-white shadow-sm"
      : "border-white/60 bg-white/70 text-[#4d47b6] hover:bg-white/90",
  );

export function EcommerceDashboardClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);
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

  const [shopPath, setShopPath] = useState("");

  useEffect(() => {
    if (!data?.store.id) {
      setShopPath("");
      return;
    }
    setShopPath(ecommercePublicShopUrl(data.store.id, window.location.origin));
  }, [data?.store.id]);

  async function copyLink() {
    if (!shopPath) return;
    try {
      await navigator.clipboard.writeText(shopPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const salesRangeHint =
    sales?.from && sales?.to
      ? sales.from === sales.to
        ? sales.from
        : `${sales.from} – ${sales.to}`
      : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className="appDashboardSectionVioletClass">
        <AppSectionHeader
          title="ยอดขาย"
          description="สรุปตามช่วงเวลา (เขตเวลากรุงเทพ) · นับทุกออเดอร์ที่สร้างในช่วง"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <Link
              href="/dashboard/ecommerce-store/orders"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/80 px-0 text-sm font-semibold text-[#4d47b6] sm:min-w-0 sm:px-4"
              aria-label="ดูรายการออเดอร์"
            >
              <span className="hidden sm:inline">ดูออเดอร์</span>
              <span className="sm:hidden" aria-hidden>
                →
              </span>
            </Link>
          }
        />

        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
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
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-white/55 bg-white/50 p-3">
            <label className="flex min-w-[8.5rem] flex-1 flex-col gap-1 text-xs font-semibold text-[#66638c]">
              ตั้งแต่
              <input
                type="date"
                value={customDraftFrom}
                onChange={(e) => setCustomDraftFrom(e.target.value)}
                className="min-h-[40px] rounded-xl border border-white/70 bg-white/90 px-3 text-sm font-semibold text-[#1e1b4b]"
              />
            </label>
            <label className="flex min-w-[8.5rem] flex-1 flex-col gap-1 text-xs font-semibold text-[#66638c]">
              ถึง
              <input
                type="date"
                value={customDraftTo}
                onChange={(e) => setCustomDraftTo(e.target.value)}
                className="min-h-[40px] rounded-xl border border-white/70 bg-white/90 px-3 text-sm font-semibold text-[#1e1b4b]"
              />
            </label>
            <button
              type="button"
              onClick={() => void applyCustomRange()}
              className="min-h-[40px] rounded-xl bg-[#5b61ff] px-4 text-sm font-black text-white shadow-sm"
            >
              ดูยอด
            </button>
          </div>
        ) : null}

        {salesError ? (
          <p className="mt-3 text-sm font-semibold text-rose-700">{salesError}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/80 px-4 py-4 ring-1 ring-[#5b61ff]/10 sm:col-span-1">
            <p className="text-xs font-semibold text-[#8b87b8]">
              {sales?.label ?? "—"}
              {salesRangeHint ? (
                <span className="mt-0.5 block font-medium text-[#66638c]">{salesRangeHint}</span>
              ) : null}
            </p>
            <p
              className="mt-2 font-black text-3xl tracking-tight text-[#1e1b4b] tabular-nums sm:text-4xl"
              aria-busy={salesLoading}
            >
              {salesLoading ? "…" : `฿${formatEcommerceBaht(sales?.totalBaht ?? 0)}`}
            </p>
          </div>
          <StatCard
            label="จำนวนออเดอร์"
            value={salesLoading ? "—" : (sales?.orderCount ?? 0)}
          />
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="appDashboardSectionVioletClass">
        <AppSectionHeader
          title="ภาพรวมร้าน"
          description="ลิงก์หน้าร้อง · ออเดอร์รอตรวจ · สต๊อกใกล้หมด"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            data ? (
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/80 text-[#4d47b6] sm:min-w-0 sm:gap-2 sm:px-4"
                aria-label="คัดลอกลิงก์ร้าน"
                title="คัดลอกลิงก์"
              >
                <IconCopy className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span>
              </button>
            ) : null
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard label="สินค้า" value={data?.productCount ?? "—"} />
          <StatCard label="รอตรวจสลิป" value={data?.pendingOrders ?? "—"} tone="warn" />
          <StatCard label="ใกล้หมดสต๊อก" value={data?.lowStockCount ?? "—"} tone="warn" />
          <StatCard
            label="สถานะร้าน"
            value={data?.store.merchantPaused ? "ปิดชั่วคราว" : "เปิด"}
            className="col-span-2 sm:col-span-1"
          />
        </div>
        {shopPath ? (
          <p className="mt-4 break-all text-xs text-[#66638c]">
            ลิงก์ร้าน:{" "}
            <Link href={ecommercePublicShopUrl(data!.store.id)} className="font-semibold text-[#4d47b6]">
              {shopPath}
            </Link>
          </p>
        ) : null}
      </AppDashboardSection>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  tone?: "warn";
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/55 bg-white/60 px-4 py-3 ${tone === "warn" ? "ring-1 ring-amber-200/80" : ""} ${className ?? ""}`}
    >
      <p className="text-xs font-semibold text-[#8b87b8]">{label}</p>
      <p className="mt-1 font-black text-2xl tracking-tight text-[#1e1b4b] tabular-nums">{value}</p>
    </div>
  );
}

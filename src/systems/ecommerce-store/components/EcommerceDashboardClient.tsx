"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatEcommerceBaht } from "@/lib/ecommerce/sales-period";
import {
  ecommerceStoreDashboardStatsGridClass,
  ecommerceStoreSectionHeadingClass,
  ecommerceStoreStatInlineClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type Summary = {
  store: { id: string; storeName: string; merchantPaused: boolean };
  pendingOrders: number;
  lowStockCount: number;
  productCount: number;
  monthRevenueBaht: number;
  monthOrderCount: number;
};

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

export function EcommerceDashboardClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [storeRes, prodRes, ordRes, salesRes] = await Promise.all([
          fetch("/api/ecommerce-store/session/store"),
          fetch("/api/ecommerce-store/session/products"),
          fetch("/api/ecommerce-store/session/orders?status=PENDING_SLIP"),
          fetch("/api/ecommerce-store/session/sales-summary?period=month"),
        ]);
        const storeJ = await storeRes.json();
        const prodJ = await prodRes.json();
        const ordJ = await ordRes.json();
        const salesJ = (await salesRes.json()) as { totalBaht?: number; orderCount?: number };
        const products = (prodJ.products ?? []) as { stockBalance: number }[];
        const threshold = prodJ.lowStockThreshold ?? 5;
        setData({
          store: storeJ.store,
          pendingOrders: (ordJ.orders ?? []).length,
          productCount: products.length,
          lowStockCount: products.filter((p) => p.stockBalance <= threshold).length,
          monthRevenueBaht: salesJ.totalBaht ?? 0,
          monthOrderCount: salesJ.orderCount ?? 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const storeOpen = data ? !data.store.merchantPaused : null;

  const statusMeta = (() => {
    if (!data) return "สรุปด่วนของร้าน";
    const parts = [data.store.storeName];
    if (storeOpen != null) parts.push(storeOpen ? "ร้านเปิด" : "ปิดชั่วคราว");
    parts.push(`สินค้า ${data.productCount.toLocaleString("th-TH")}`);
    return parts.join(" · ");
  })();

  return (
    <div className="space-y-3">
      <div className="min-w-0">
        <h3 className={ecommerceStoreSectionHeadingClass}>สถานะร้าน</h3>
        <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{statusMeta}</p>
      </div>

      <div className={ecommerceStoreDashboardStatsGridClass}>
        <OverviewStat
          title="รายรับเดือนนี้"
          value={loading ? "…" : `฿${formatEcommerceBaht(data?.monthRevenueBaht ?? 0)}`}
          tone="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" strokeLinecap="round" />
            </svg>
          }
        />
        <OverviewStat
          title="ออเดอร์เดือนนี้"
          value={loading ? "—" : (data?.monthOrderCount ?? 0).toLocaleString("th-TH")}
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

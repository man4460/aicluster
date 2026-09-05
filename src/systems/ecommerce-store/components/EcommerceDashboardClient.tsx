"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatEcommerceBaht } from "@/lib/ecommerce/sales-period";
import {
  ecommerceStoreCardIconTileClass,
  ecommerceStoreTonedRowCardClass,
  type EcommerceStoreCardTone,
} from "@/systems/ecommerce-store/lib/card-tones";
import {
  ecommerceGradientPriceClass,
  ecommerceProductTagClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  ecommerceStoreDashboardStatsGridClass,
  ecommerceStoreSectionHeadingClass,
  ecommerceStoreStatInlineClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { ECOMMERCE_STORE_MANAGE_HREF } from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  useEcommerceApiFetch,
  useEcommerceStaffAuth,
} from "@/systems/ecommerce-store/lib/staff-api-fetch";

type TopProduct = {
  rank: number;
  productId: string;
  name: string;
  imageUrl: string | null;
  sku: string | null;
  priceBaht: string | null;
  stockBalance: number | null;
  soldQty: number;
  soldBaht: number;
};

type Summary = {
  store: { id: string; storeName: string; merchantPaused: boolean };
  pendingOrders: number;
  lowStockCount: number;
  productCount: number;
  monthRevenueBaht: number;
  monthOrderCount: number;
  salesLabel: string;
  topProducts: TopProduct[];
};

const STAT_ACCENTS = {
  slate: "border-l-slate-400 text-slate-700",
  amber: "border-l-amber-500 text-amber-800",
  sky: "border-l-sky-500 text-sky-800",
  emerald: "border-l-emerald-500 text-emerald-800",
  rose: "border-l-rose-500 text-rose-800",
  indigo: "border-l-indigo-500 text-indigo-800",
} as const;

function rankTone(rank: number): EcommerceStoreCardTone {
  if (rank === 1) return "amber";
  if (rank === 2) return "slate";
  if (rank === 3) return "rose";
  if (rank <= 5) return "violet";
  return "sky";
}

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
  const apiFetch = useEcommerceApiFetch();
  const staffAuth = useEcommerceStaffAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const lb = useAppImageLightbox();

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [storeRes, prodRes, ordRes, salesRes] = await Promise.all([
          apiFetch("/api/ecommerce-store/session/store", { cache: "no-store" }),
          apiFetch("/api/ecommerce-store/session/products", { cache: "no-store" }),
          apiFetch("/api/ecommerce-store/session/orders?status=PENDING_SLIP", { cache: "no-store" }),
          apiFetch("/api/ecommerce-store/session/sales-summary?period=month", { cache: "no-store" }),
        ]);
        const storeJ = await storeRes.json();
        const prodJ = await prodRes.json();
        const ordJ = await ordRes.json();
        const salesJ = (await salesRes.json()) as {
          totalBaht?: number;
          orderCount?: number;
          label?: string;
          topProducts?: TopProduct[];
        };
        const products = (prodJ.products ?? []) as { stockBalance: number }[];
        const threshold = prodJ.lowStockThreshold ?? 5;
        setData({
          store: storeJ.store,
          pendingOrders: (ordJ.orders ?? []).length,
          productCount: products.length,
          lowStockCount: products.filter((p) => p.stockBalance <= threshold).length,
          monthRevenueBaht: salesJ.totalBaht ?? 0,
          monthOrderCount: salesJ.orderCount ?? 0,
          salesLabel: salesJ.label ?? "เดือนนี้",
          topProducts: Array.isArray(salesJ.topProducts) ? salesJ.topProducts.slice(0, 10) : [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch]);

  const storeOpen = data ? !data.store.merchantPaused : null;

  const statusMeta = (() => {
    if (!data) return "สรุปด่วนของร้าน";
    const parts = [data.store.storeName];
    if (storeOpen != null) parts.push(storeOpen ? "ร้านเปิด" : "ปิดชั่วคราว");
    parts.push(`สินค้า ${data.productCount.toLocaleString("th-TH")}`);
    return parts.join(" · ");
  })();

  return (
    <div className="space-y-4">
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

      <section className="space-y-2.5" aria-label="สินค้าขายดี 10 อันดับ">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className={ecommerceStoreSectionHeadingClass}>สินค้าขายดี · 10 อันดับ</h3>
            <p className="mt-0.5 text-xs font-medium text-[#66638c]">
              เรียงตามจำนวนชิ้นที่ขาย · {data?.salesLabel ?? "เดือนนี้"}
            </p>
          </div>
          {!staffAuth ? (
            <Link
              href={ECOMMERCE_STORE_MANAGE_HREF}
              className="text-xs font-bold text-[#4d47b6] underline-offset-2 hover:underline"
            >
              จัดการสินค้า
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-slate-100/80" aria-hidden />
        ) : !data?.topProducts.length ? (
          <AppEmptyState tone="slate">
            ยังไม่มียอดขายในช่วงนี้ — เมื่อมีออเดอร์จะแสดงอันดับขายดีที่นี่
          </AppEmptyState>
        ) : (
          <ol className="grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {data.topProducts.map((p) => {
              const tone = rankTone(p.rank);
              return (
                <li key={p.productId} className={ecommerceStoreTonedRowCardClass(tone)}>
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black tabular-nums ring-1",
                        p.rank === 1 && "bg-amber-100 text-amber-800 ring-amber-200/80",
                        p.rank === 2 && "bg-slate-100 text-slate-700 ring-slate-200/80",
                        p.rank === 3 && "bg-rose-100 text-rose-700 ring-rose-200/80",
                        p.rank > 3 && "bg-white/80 text-[#4d47b6] ring-slate-200/80",
                      )}
                      aria-label={`อันดับ ${p.rank}`}
                    >
                      {p.rank}
                    </span>
                    {p.imageUrl ? (
                      <AppImageThumb
                        src={p.imageUrl}
                        alt={p.name}
                        onOpen={() => lb.open(p.imageUrl!)}
                        className="h-12 w-12 shrink-0 rounded-lg"
                      />
                    ) : (
                      <span className={ecommerceStoreCardIconTileClass(tone)} aria-hidden>
                        <Package className="h-5 w-5" strokeWidth={2.1} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-black text-[#1e1b4b]">{p.name}</p>
                      <p className="truncate text-[11px] font-medium text-[#66638c]">
                        {p.sku ? `SKU ${p.sku}` : "—"}
                        {p.priceBaht != null
                          ? ` · ฿${Number(p.priceBaht).toLocaleString("th-TH")}`
                          : ""}
                      </p>
                      {p.rank <= 3 ? (
                        <span className={ecommerceProductTagClass(p.rank === 1 ? "amber" : "violet")}>
                          Top {p.rank}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <p className="text-sm font-black tabular-nums text-[#1e1b4b]">
                      {p.soldQty.toLocaleString("th-TH")}{" "}
                      <span className="text-[11px] font-bold text-[#66638c]">ชิ้น</span>
                    </p>
                    <p className={cn("text-xs font-black tabular-nums", ecommerceGradientPriceClass)}>
                      ฿{formatEcommerceBaht(p.soldBaht)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปสินค้า" />
    </div>
  );
}

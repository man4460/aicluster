"use client";

import { Package, RefreshCw, ShoppingBag } from "lucide-react";
import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  ECOMMERCE_STORE_BASE,
  ECOMMERCE_STORE_DASHBOARD_TAB_ITEMS,
  parseEcommerceStoreDashboardTab,
  type EcommerceStoreDashboardTabKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import { EcommerceDashboardClient } from "@/systems/ecommerce-store/components/EcommerceDashboardClient";
import {
  EcommerceOrdersClient,
  type EcommerceOrdersEmbeddedToolbarApi,
} from "@/systems/ecommerce-store/components/EcommerceOrdersClient";
import { EcommercePageSubNav } from "@/systems/ecommerce-store/components/EcommercePageSubNav";
import { EcommercePosClient } from "@/systems/ecommerce-store/components/EcommercePosClient";
import { IconClipboard, IconStore } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import {
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

const TAB_ICONS: Record<EcommerceStoreDashboardTabKey, ReactNode> = {
  overview: <IconStore className="h-3.5 w-3.5" />,
  orders: <IconClipboard className="h-3.5 w-3.5" />,
  pos: <ShoppingBag className="h-3.5 w-3.5" />,
};

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function EcommerceDashboardHubInner() {
  const router = useRouter();
  const pathname = usePathname() ?? ECOMMERCE_STORE_BASE;
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseEcommerceStoreDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  const [ordersToolbar, setOrdersToolbar] = useState<EcommerceOrdersEmbeddedToolbarApi | null>(null);

  const registerOrdersToolbar = useCallback((api: EcommerceOrdersEmbeddedToolbarApi | null) => {
    setOrdersToolbar(api);
  }, []);

  const setTab = useCallback(
    (next: string) => {
      const key = parseEcommerceStoreDashboardTab(next);
      const q = new URLSearchParams(searchParams.toString());
      if (key === "overview") q.delete("tab");
      else q.set("tab", key);
      const qs = q.toString();
      const base = pathname.startsWith(`${ECOMMERCE_STORE_BASE}/orders`)
        ? ECOMMERCE_STORE_BASE
        : pathname.replace(/\/+$/, "") || ECOMMERCE_STORE_BASE;
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const ordersActions = (
    <div className={ecommerceStoreInlineSubNavShellClass}>
      <button
        type="button"
        className={cn(
          ecommerceStoreInlineSubNavBtnClass(ordersToolbar?.filterOpen ?? false),
          "relative",
          ordersToolbar?.hasActiveFilters && !ordersToolbar.filterOpen && "ring-1 ring-amber-300/80",
        )}
        title={ordersToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        aria-label={ordersToolbar?.filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        aria-expanded={ordersToolbar?.filterOpen ?? false}
        aria-controls="ecommerce-orders-filter-panel"
        disabled={!ordersToolbar}
        onClick={() => ordersToolbar?.toggleFilter()}
      >
        <IconFilter className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{ordersToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {ordersToolbar?.hasActiveFilters && !ordersToolbar.filterOpen ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
      <button
        type="button"
        className={cn(ecommerceStoreInlineSubNavBtnClass(false), "disabled:opacity-50")}
        title="รีเฟรช"
        aria-label="รีเฟรชออเดอร์ออนไลน์"
        aria-busy={ordersToolbar?.loading}
        disabled={!ordersToolbar || ordersToolbar.loading}
        onClick={() => ordersToolbar?.reload()}
      >
        <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", ordersToolbar?.loading && "animate-spin")} aria-hidden />
        <span className="hidden sm:inline">รีเฟรช</span>
      </button>
    </div>
  );

  return (
    <EcommercePageSubNav
      title="แดชบอร์ด"
      titleIcon={<Package className="h-4 w-4" aria-hidden />}
      ariaLabel="เมนูย่อยแดชบอร์ดร้านออนไลน์"
      activeKey={tab}
      onSelect={setTab}
      mobileSelect={{ id: "ecommerce-dashboard-tab-mobile", label: "เลือกเมนูแดชบอร์ด" }}
      items={ECOMMERCE_STORE_DASHBOARD_TAB_ITEMS.map((item) => ({
        key: item.key,
        label: item.label,
        shortLabel: item.shortLabel,
        icon: TAB_ICONS[item.key],
      }))}
      action={tab === "orders" ? ordersActions : undefined}
    >
      {tab === "overview" ? <EcommerceDashboardClient /> : null}
      {tab === "orders" ? (
        <EcommerceOrdersClient embedded onEmbeddedToolbar={registerOrdersToolbar} />
      ) : null}
      {tab === "pos" ? <EcommercePosClient /> : null}
    </EcommercePageSubNav>
  );
}

export function EcommerceDashboardHubClient() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" aria-busy />}>
      <EcommerceDashboardHubInner />
    </Suspense>
  );
}

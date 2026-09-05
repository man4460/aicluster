"use client";

import { Package, ShoppingBag } from "lucide-react";
import { Suspense, useCallback, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ECOMMERCE_STORE_BASE,
  ECOMMERCE_STORE_DASHBOARD_TAB_ITEMS,
  parseEcommerceStoreDashboardTab,
  type EcommerceStoreDashboardTabKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import { EcommerceDashboardClient } from "@/systems/ecommerce-store/components/EcommerceDashboardClient";
import { EcommerceOrdersClient } from "@/systems/ecommerce-store/components/EcommerceOrdersClient";
import { EcommercePageSubNav } from "@/systems/ecommerce-store/components/EcommercePageSubNav";
import { EcommercePosClient } from "@/systems/ecommerce-store/components/EcommercePosClient";
import { IconClipboard, IconStore } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

const TAB_ICONS: Record<EcommerceStoreDashboardTabKey, ReactNode> = {
  overview: <IconStore className="h-3.5 w-3.5" />,
  orders: <IconClipboard className="h-3.5 w-3.5" />,
  pos: <ShoppingBag className="h-3.5 w-3.5" />,
};

function EcommerceDashboardHubInner() {
  const router = useRouter();
  const pathname = usePathname() ?? ECOMMERCE_STORE_BASE;
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseEcommerceStoreDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

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
    >
      {tab === "overview" ? <EcommerceDashboardClient /> : null}
      {tab === "orders" ? <EcommerceOrdersClient embedded /> : null}
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

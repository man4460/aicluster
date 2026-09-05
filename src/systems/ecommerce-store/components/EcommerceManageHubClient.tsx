"use client";

import { ClipboardList, Package, Users } from "lucide-react";
import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EcommerceCrmClient } from "@/systems/ecommerce-store/components/EcommerceCrmClient";
import { EcommercePageSubNav } from "@/systems/ecommerce-store/components/EcommercePageSubNav";
import { EcommerceProductsClient } from "@/systems/ecommerce-store/components/EcommerceProductsClient";
import {
  ECOMMERCE_STORE_MANAGE_TAB_ITEMS,
  ecommerceStoreManageHref,
  parseEcommerceStoreManageTab,
  type EcommerceStoreManageTabKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import { ecommerceStoreContentStackClass } from "@/systems/ecommerce-store/lib/ui-tokens";

function manageTabIcon(key: EcommerceStoreManageTabKey) {
  if (key === "crm") return <Users className="h-3.5 w-3.5" aria-hidden />;
  return <Package className="h-3.5 w-3.5" aria-hidden />;
}

function EcommerceManageHubTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseEcommerceStoreManageTab(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = useCallback(
    (next: string) => {
      const key = parseEcommerceStoreManageTab(next);
      router.replace(ecommerceStoreManageHref(key), { scroll: false });
    },
    [router],
  );

  return (
    <EcommercePageSubNav
      title="การจัดการ"
      titleIcon={<ClipboardList className="h-4 w-4" aria-hidden />}
      items={ECOMMERCE_STORE_MANAGE_TAB_ITEMS.map((item) => ({
        key: item.key,
        label: item.label,
        shortLabel: item.shortLabel,
        icon: manageTabIcon(item.key),
      }))}
      activeKey={tab}
      onSelect={setTab}
      ariaLabel="แท็บการจัดการ"
      mobileSelect={{ id: "ecommerce-manage-tab-select", label: "เลือกหมวดการจัดการ" }}
    >
      <div className={ecommerceStoreContentStackClass}>
        {tab === "crm" ? <EcommerceCrmClient embedded /> : <EcommerceProductsClient embedded />}
      </div>
    </EcommercePageSubNav>
  );
}

export function EcommerceManageHubClient() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-8 text-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      }
    >
      <EcommerceManageHubTabs />
    </Suspense>
  );
}

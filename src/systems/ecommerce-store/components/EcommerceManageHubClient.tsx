"use client";

import {
  ClipboardList,
  Download,
  Package,
  Plus,
  RefreshCw,
  Upload,
  Users,
  Warehouse,
} from "lucide-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  EcommerceCrmClient,
  type EcommerceCrmEmbeddedToolbarApi,
} from "@/systems/ecommerce-store/components/EcommerceCrmClient";
import { EcommercePageSubNav } from "@/systems/ecommerce-store/components/EcommercePageSubNav";
import {
  EcommerceProductsClient,
  type EcommerceProductsEmbeddedToolbarApi,
} from "@/systems/ecommerce-store/components/EcommerceProductsClient";
import {
  EcommerceStockClient,
  type EcommerceStockEmbeddedToolbarApi,
} from "@/systems/ecommerce-store/components/EcommerceStockClient";
import {
  ECOMMERCE_STORE_MANAGE_TAB_ITEMS,
  ecommerceStoreManageHref,
  parseEcommerceStoreManageTab,
  type EcommerceStoreManageTabKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

function manageTabIcon(key: EcommerceStoreManageTabKey) {
  if (key === "crm") return <Users className="h-3.5 w-3.5" aria-hidden />;
  if (key === "stock") return <Warehouse className="h-3.5 w-3.5" aria-hidden />;
  return <Package className="h-3.5 w-3.5" aria-hidden />;
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function EcommerceManageHubTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseEcommerceStoreManageTab(searchParams.get("tab")),
    [searchParams],
  );

  const [productsToolbar, setProductsToolbar] = useState<EcommerceProductsEmbeddedToolbarApi | null>(null);
  const [stockToolbar, setStockToolbar] = useState<EcommerceStockEmbeddedToolbarApi | null>(null);
  const [crmToolbar, setCrmToolbar] = useState<EcommerceCrmEmbeddedToolbarApi | null>(null);

  const registerProductsToolbar = useCallback((api: EcommerceProductsEmbeddedToolbarApi | null) => {
    setProductsToolbar(api);
  }, []);

  const registerStockToolbar = useCallback((api: EcommerceStockEmbeddedToolbarApi | null) => {
    setStockToolbar(api);
  }, []);

  const registerCrmToolbar = useCallback((api: EcommerceCrmEmbeddedToolbarApi | null) => {
    setCrmToolbar(api);
  }, []);

  const setTab = useCallback(
    (next: string) => {
      const key = parseEcommerceStoreManageTab(next);
      router.replace(ecommerceStoreManageHref(key), { scroll: false });
    },
    [router],
  );

  const productsActions = (
    <div className={ecommerceStoreInlineSubNavShellClass}>
      <button
        type="button"
        className={cn(
          ecommerceStoreInlineSubNavBtnClass(productsToolbar?.filterOpen ?? false),
          "relative",
          productsToolbar?.hasActiveFilters && !productsToolbar.filterOpen && "ring-1 ring-amber-300/80",
        )}
        title={productsToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        aria-label={productsToolbar?.filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        aria-expanded={productsToolbar?.filterOpen ?? false}
        aria-controls="ecommerce-products-filter-panel"
        disabled={!productsToolbar}
        onClick={() => productsToolbar?.toggleFilter()}
      >
        <IconFilter className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{productsToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {productsToolbar?.hasActiveFilters && !productsToolbar.filterOpen ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
      <button
        type="button"
        className={ecommerceStoreInlineSubNavBtnClass(false)}
        title="เพิ่มหมวดหมู่"
        aria-label="เพิ่มหมวดหมู่"
        disabled={!productsToolbar}
        onClick={() => productsToolbar?.openAddCategory()}
      >
        <span className="hidden sm:inline">+ หมวด</span>
        <span className="sm:hidden text-[10px] font-black" aria-hidden>
          หมวด
        </span>
      </button>
      <button
        type="button"
        className={ecommerceStoreInlineSubNavBtnClass(false)}
        title="เพิ่มสินค้า"
        aria-label="เพิ่มสินค้า"
        disabled={!productsToolbar}
        onClick={() => productsToolbar?.openAddProduct()}
      >
        <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">เพิ่มสินค้า</span>
      </button>
    </div>
  );

  const stockActions = (
    <div className={ecommerceStoreInlineSubNavShellClass}>
      <button
        type="button"
        className={cn(
          ecommerceStoreInlineSubNavBtnClass(stockToolbar?.filterOpen ?? false),
          "relative",
          stockToolbar?.hasActiveFilters && !stockToolbar.filterOpen && "ring-1 ring-amber-300/80",
        )}
        title={stockToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        aria-label={stockToolbar?.filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        aria-expanded={stockToolbar?.filterOpen ?? false}
        aria-controls="ecommerce-stock-filter-panel"
        disabled={!stockToolbar}
        onClick={() => stockToolbar?.toggleFilter()}
      >
        <IconFilter className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{stockToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {stockToolbar?.hasActiveFilters && !stockToolbar.filterOpen ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
      <button
        type="button"
        className={ecommerceStoreInlineSubNavBtnClass(false)}
        title="หมวดหมู่สต๊อก"
        aria-label="จัดการหมวดหมู่สต๊อก"
        disabled={!stockToolbar}
        onClick={() => stockToolbar?.openCategories()}
      >
        <span className="hidden sm:inline">หมวด</span>
        <span className="sm:hidden text-[10px] font-black" aria-hidden>
          หมวด
        </span>
      </button>
      <button
        type="button"
        className={ecommerceStoreInlineSubNavBtnClass(false)}
        title="ดาวน์โหลดแบบฟอร์ม Excel"
        aria-label="ดาวน์โหลดแบบฟอร์ม Excel"
        disabled={!stockToolbar}
        onClick={() => stockToolbar?.downloadTemplate()}
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">แบบฟอร์ม</span>
      </button>
      <button
        type="button"
        className={cn(ecommerceStoreInlineSubNavBtnClass(false), "disabled:opacity-50")}
        title="นำเข้า Excel"
        aria-label="นำเข้า Excel"
        disabled={!stockToolbar || stockToolbar.importBusy}
        onClick={() => stockToolbar?.triggerImport()}
      >
        <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">นำเข้า</span>
      </button>
      <button
        type="button"
        className={ecommerceStoreInlineSubNavBtnClass(false)}
        title="ส่งออก Excel"
        aria-label="ส่งออก Excel"
        disabled={!stockToolbar}
        onClick={() => stockToolbar?.downloadExport()}
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">ส่งออก</span>
      </button>
      <button
        type="button"
        className={cn(ecommerceStoreInlineSubNavBtnClass(false), "disabled:opacity-50")}
        title="รีเฟรช"
        aria-label="รีเฟรชสต๊อก"
        disabled={!stockToolbar || stockToolbar.loading}
        onClick={() => stockToolbar?.reload()}
      >
        <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", stockToolbar?.loading && "animate-spin")} aria-hidden />
      </button>
      <button
        type="button"
        className={ecommerceStoreInlineSubNavBtnClass(false)}
        title="เพิ่มสต๊อก"
        aria-label="เพิ่มสต๊อก"
        disabled={!stockToolbar}
        onClick={() => stockToolbar?.openAdd()}
      >
        <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">เพิ่ม</span>
      </button>
    </div>
  );

  const crmActions = (
    <div className={ecommerceStoreInlineSubNavShellClass}>
      <button
        type="button"
        className={cn(
          ecommerceStoreInlineSubNavBtnClass(crmToolbar?.filterOpen ?? false),
          "relative",
          crmToolbar?.hasActiveFilters && !crmToolbar.filterOpen && "ring-1 ring-amber-300/80",
        )}
        title={crmToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        aria-label={crmToolbar?.filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        aria-expanded={crmToolbar?.filterOpen ?? false}
        aria-controls="ecommerce-crm-filter-panel"
        disabled={!crmToolbar}
        onClick={() => crmToolbar?.toggleFilter()}
      >
        <IconFilter className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{crmToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {crmToolbar?.hasActiveFilters && !crmToolbar.filterOpen ? (
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
        aria-label="รีเฟรชรายชื่อลูกค้า"
        aria-busy={crmToolbar?.loading}
        disabled={!crmToolbar || crmToolbar.loading}
        onClick={() => crmToolbar?.reload()}
      >
        <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", crmToolbar?.loading && "animate-spin")} aria-hidden />
        <span className="hidden sm:inline">รีเฟรช</span>
      </button>
    </div>
  );

  const action =
    tab === "crm" ? crmActions : tab === "stock" ? stockActions : productsActions;

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
      action={action}
    >
      {tab === "crm" ? (
        <EcommerceCrmClient embedded onEmbeddedToolbar={registerCrmToolbar} />
      ) : tab === "stock" ? (
        <EcommerceStockClient embedded onEmbeddedToolbar={registerStockToolbar} />
      ) : (
        <EcommerceProductsClient embedded onEmbeddedToolbar={registerProductsToolbar} />
      )}
    </EcommercePageSubNav>
  );
}

export function EcommerceManageHubClient() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-slate-200/90 bg-white px-4 py-8 text-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      }
    >
      <EcommerceManageHubTabs />
    </Suspense>
  );
}

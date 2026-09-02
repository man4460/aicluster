"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { LaundryPackagesClient, type LaundryPackagesEmbeddedToolbarApi } from "@/systems/laundry/components/LaundryPackagesClient";
import {
  LaundryPurchasesClient,
  type LaundryPurchasesEmbeddedToolbarApi,
} from "@/systems/laundry/components/LaundryPurchasesClient";
import {
  LAUNDRY_MANAGE_TAB_ITEMS,
  laundryManageHref,
  parseLaundryManageTab,
  type LaundryManageTabKey,
} from "@/systems/laundry/laundry-module-nav";
import type { LaundryRepository } from "@/systems/laundry/laundry-service";
import {
  laundryInlineSubNavBtnClass,
  laundryInlineSubNavShellClass,
  laundryMutedLoadingNoticeClass,
  laundryPanelClass,
  laundryPanelDividerClass,
  laundryPanelSectionClass,
} from "@/systems/laundry/lib/ui-tokens";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function LaundryManageHubTabs({ repo }: { repo?: LaundryRepository }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pkgToolbar, setPkgToolbar] = useState<LaundryPackagesEmbeddedToolbarApi | null>(null);
  const [purchaseToolbar, setPurchaseToolbar] = useState<LaundryPurchasesEmbeddedToolbarApi | null>(null);

  const registerPkgToolbar = useCallback((api: LaundryPackagesEmbeddedToolbarApi | null) => {
    setPkgToolbar(api);
  }, []);

  const registerPurchaseToolbar = useCallback((api: LaundryPurchasesEmbeddedToolbarApi | null) => {
    setPurchaseToolbar(api);
  }, []);

  const tab = useMemo(() => parseLaundryManageTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: LaundryManageTabKey) => {
      router.replace(laundryManageHref(next), { scroll: false });
    },
    [router],
  );

  return (
    <div className={laundryPanelClass}>
      <div className={laundryPanelSectionClass}>
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">การจัดการ</h2>
          <div
            className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
            role="group"
            aria-label="เครื่องมือการจัดการ"
          >
            <nav className={laundryInlineSubNavShellClass} role="tablist" aria-label="แท็บการจัดการ">
              {LAUNDRY_MANAGE_TAB_ITEMS.map((item) => {
                const active = tab === item.key;
                const short =
                  item.key === "packages" ? "แพ็ก"
                  : item.key === "members" ? "สมาชิก"
                  : item.label;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    title={item.label}
                    aria-label={item.label}
                    className={laundryInlineSubNavBtnClass(active)}
                    onClick={() => setTab(item.key)}
                  >
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden" aria-hidden>
                      {short}
                    </span>
                  </button>
                );
              })}
            </nav>
            {tab === "packages" ?
              <div className={laundryInlineSubNavShellClass}>
                <button
                  type="button"
                  className={cn(
                    laundryInlineSubNavBtnClass(pkgToolbar?.filterOpen ?? false),
                    "relative",
                    pkgToolbar?.hasActiveFilters && !pkgToolbar.filterOpen && "ring-1 ring-amber-300/80",
                  )}
                  title={pkgToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  aria-label={pkgToolbar?.filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  aria-expanded={pkgToolbar?.filterOpen ?? false}
                  aria-controls="laundry-packages-filter-panel"
                  disabled={!pkgToolbar}
                  onClick={() => pkgToolbar?.toggleFilter()}
                >
                  <IconFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">
                    {pkgToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  </span>
                  {pkgToolbar?.hasActiveFilters && !pkgToolbar.filterOpen ?
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                      aria-hidden
                    />
                  : null}
                </button>
                <button
                  type="button"
                  className={laundryInlineSubNavBtnClass(false)}
                  title="เพิ่มแพ็กเกจ"
                  aria-label="เพิ่มแพ็กเกจ"
                  disabled={!pkgToolbar}
                  onClick={() => pkgToolbar?.openAddModal()}
                >
                  <IconPlus className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">เพิ่มแพ็ก</span>
                </button>
              </div>
            : <>
                <div className={laundryInlineSubNavShellClass}>
                  <button
                    type="button"
                    className={cn(
                      laundryInlineSubNavBtnClass(purchaseToolbar?.filterOpen ?? false),
                      "relative",
                      purchaseToolbar?.hasActiveFilters && !purchaseToolbar.filterOpen && "ring-1 ring-amber-300/80",
                    )}
                    title={purchaseToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                    aria-label={purchaseToolbar?.filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                    aria-expanded={purchaseToolbar?.filterOpen ?? false}
                    aria-controls="laundry-purchases-filter-panel"
                    disabled={!purchaseToolbar}
                    onClick={() => purchaseToolbar?.toggleFilter()}
                  >
                    <IconFilter className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">
                      {purchaseToolbar?.filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                    </span>
                    {purchaseToolbar?.hasActiveFilters && !purchaseToolbar.filterOpen ?
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
                        aria-hidden
                      />
                    : null}
                  </button>
                  <button
                    type="button"
                    className={laundryInlineSubNavBtnClass(false)}
                    title="ขายแพ็กเกจ"
                    aria-label="ขายแพ็กเกจ"
                    disabled={!purchaseToolbar}
                    onClick={() => purchaseToolbar?.openSellModal()}
                  >
                    <IconPlus className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">ขายแพ็ก</span>
                  </button>
                </div>
              </>
            }
          </div>
        </div>
      </div>

      <div className={cn(laundryPanelSectionClass, laundryPanelDividerClass)}>
        {tab === "packages" ?
          <LaundryPackagesClient embedded repo={repo} onEmbeddedToolbar={registerPkgToolbar} />
        : null}
        {tab === "members" ?
          <LaundryPurchasesClient embedded onEmbeddedToolbar={registerPurchaseToolbar} />
        : null}
      </div>
    </div>
  );
}

export function LaundryManageHubClient({ repo }: { repo?: LaundryRepository }) {
  return (
    <Suspense fallback={<p className={laundryMutedLoadingNoticeClass}>กำลังโหลด…</p>}>
      <LaundryManageHubTabs repo={repo} />
    </Suspense>
  );
}

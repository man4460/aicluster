"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  BarberPackagesClient,
  type BarberPackagesEmbeddedToolbarApi,
} from "@/systems/barber/components/BarberPackagesClient";
import {
  BarberPurchasesClient,
  type BarberPurchasesEmbeddedToolbarApi,
} from "@/systems/barber/components/BarberPurchasesClient";
import {
  BarberStylistsClient,
  type BarberStylistsEmbeddedToolbarApi,
} from "@/systems/barber/components/BarberStylistsClient";
import {
  barberCardSurfaceRadiusClass,
  barberMutedLoadingNoticeClass,
  barberOffersHubHeaderShellClass,
  barberOffersTabSegmentShellClass,
  barberPageStackClass,
} from "@/systems/barber/components/barber-ui-tokens";
import {
  BARBER_MANAGE_TAB_ITEMS,
  barberManageHref,
  parseBarberManageTab,
  type BarberManageTabKey,
} from "@/systems/barber/barber-module-nav";

const tabBtnClass = (active: boolean) =>
  cn(
    `inline-flex flex-1 items-center justify-center gap-1.5 ${barberCardSurfaceRadiusClass} font-bold transition-all duration-200`,
    "min-h-[46px] min-w-0 px-2 text-[11px] leading-tight sm:min-h-0 sm:flex-initial sm:px-4 sm:py-2 sm:text-xs sm:text-sm",
    active
      ? "bg-gradient-to-br from-white via-indigo-50/90 to-violet-50/50 text-[#4338ca] shadow-sm ring-1 ring-indigo-200/55"
      : "text-[#5f5a8a] hover:bg-white/75 hover:text-[#2e2a58]",
  );

const hubPrimaryBtnClass = cn(
  "app-btn-primary min-h-[48px] w-full justify-center whitespace-nowrap shadow-md shadow-indigo-600/15 font-semibold text-white sm:min-h-[44px] sm:w-auto",
  barberCardSurfaceRadiusClass,
  "px-4 py-2.5 text-sm sm:px-4 sm:py-2.5 sm:text-sm",
);

function IconStylistsTab({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 11a3 3 0 1 0 6-3 3 3 0 0 0-3 3" />
    </svg>
  );
}

function IconPackageTab({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      className={className}
      aria-hidden
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

function IconMembersTab({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      className={className}
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function manageTabIcon(key: BarberManageTabKey, className: string) {
  switch (key) {
    case "stylists":
      return <IconStylistsTab className={className} />;
    case "packages":
      return <IconPackageTab className={className} />;
    case "members":
      return <IconMembersTab className={className} />;
  }
}

function BarberManageHubTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stylistToolbar, setStylistToolbar] = useState<BarberStylistsEmbeddedToolbarApi | null>(null);
  const [pkgToolbar, setPkgToolbar] = useState<BarberPackagesEmbeddedToolbarApi | null>(null);
  const [purchaseToolbar, setPurchaseToolbar] = useState<BarberPurchasesEmbeddedToolbarApi | null>(
    null,
  );

  const registerStylistToolbar = useCallback((api: BarberStylistsEmbeddedToolbarApi | null) => {
    setStylistToolbar(api);
  }, []);

  const registerPkgToolbar = useCallback((api: BarberPackagesEmbeddedToolbarApi | null) => {
    setPkgToolbar(api);
  }, []);

  const registerPurchaseToolbar = useCallback((api: BarberPurchasesEmbeddedToolbarApi | null) => {
    setPurchaseToolbar(api);
  }, []);

  const tab = useMemo(() => parseBarberManageTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: BarberManageTabKey) => {
      router.replace(barberManageHref(next), { scroll: false });
    },
    [router],
  );

  return (
    <div className={barberPageStackClass}>
      <div className={`print:hidden ${barberOffersHubHeaderShellClass}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black leading-snug tracking-tight sm:truncate sm:text-xl">
              <span className="bg-gradient-to-r from-[#4338ca] via-[#5b61ff] to-[#0d9488] bg-clip-text text-transparent">
                การจัดการ
              </span>
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[#5f5a8a] sm:text-[13px]">
              <span className="text-[#6366f1]">ช่าง</span>
              <span className="mx-2 text-[#d4d0ec]" aria-hidden>
                ·
              </span>
              <span className="text-[#5b61ff]">แพ็กเกจ</span>
              <span className="mx-2 text-[#d4d0ec]" aria-hidden>
                ·
              </span>
              <span className="text-[#0d9488]">สมาชิก</span>
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <nav
              className={cn(barberOffersTabSegmentShellClass, "order-1 w-full min-w-0 sm:order-2 sm:w-auto")}
              aria-label="แท็บการจัดการ"
              role="tablist"
            >
              {BARBER_MANAGE_TAB_ITEMS.map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    onClick={() => setTab(item.key)}
                    suppressHydrationWarning
                    aria-label={item.label}
                    aria-selected={active}
                    aria-current={active ? "page" : undefined}
                    className={tabBtnClass(active)}
                  >
                    {manageTabIcon(
                      item.key,
                      cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-[#9b97b8]"),
                    )}
                    <span className="max-w-[5.5rem] text-center sm:max-w-none">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="order-2 flex w-full flex-col gap-2 sm:order-1 sm:w-auto sm:flex-row sm:justify-end">
              {tab === "stylists" && stylistToolbar ? (
                <button
                  type="button"
                  onClick={() => stylistToolbar.openAddModal()}
                  className={hubPrimaryBtnClass}
                >
                  เพิ่มช่าง
                </button>
              ) : null}
              {tab === "packages" && pkgToolbar ? (
                <button type="button" onClick={() => pkgToolbar.openAddModal()} className={hubPrimaryBtnClass}>
                  เพิ่มแพ็กเกจ
                </button>
              ) : null}
              {tab === "members" && purchaseToolbar ? (
                <button
                  type="button"
                  onClick={() => purchaseToolbar.openSellModal()}
                  className={hubPrimaryBtnClass}
                >
                  ขายแพ็กเกจ
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {tab === "stylists" ? (
        <BarberStylistsClient embedded onEmbeddedToolbar={registerStylistToolbar} />
      ) : null}
      {tab === "packages" ? (
        <BarberPackagesClient embedded onEmbeddedToolbar={registerPkgToolbar} />
      ) : null}
      {tab === "members" ? (
        <BarberPurchasesClient embedded onEmbeddedToolbar={registerPurchaseToolbar} />
      ) : null}
    </div>
  );
}

export function BarberManageHubClient() {
  return (
    <Suspense fallback={<p className={barberMutedLoadingNoticeClass}>กำลังโหลด…</p>}>
      <BarberManageHubTabs />
    </Suspense>
  );
}

"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  barberCtaClass,
  barberHeaderEnLabelClass,
  barberMutedLoadingNoticeClass,
  barberNavActiveClass,
  barberNavIdleClass,
  barberOffersHubHeaderShellClass,
  barberOffersTabSegmentShellClass,
  barberPageStackClass,
} from "@/systems/barber/components/barber-ui-tokens";

type OffersTab = "packages" | "members";

const tabBtnClass = (active: boolean) =>
  cn(
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[2rem] font-bold transition-all duration-200 sm:rounded-[1.25rem]",
    "min-h-[46px] min-w-0 px-2 text-[11px] leading-tight sm:min-h-0 sm:flex-initial sm:px-4 sm:py-2 sm:text-xs sm:text-sm",
    active ? barberNavActiveClass : barberNavIdleClass,
  );

const hubPrimaryBtnClass = cn(
  barberCtaClass,
  "min-h-[48px] w-full justify-center whitespace-nowrap sm:min-h-[44px] sm:w-auto",
  "px-4 py-2.5 text-sm sm:px-4 sm:py-2.5 sm:text-sm",
);

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

function parseOffersTab(raw: string | null): OffersTab {
  if (raw === "members") return "members";
  return "packages";
}

function BarberPackagesHubTabs() {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/barber/packages";
  const searchParams = useSearchParams();

  const [pkgToolbar, setPkgToolbar] = useState<BarberPackagesEmbeddedToolbarApi | null>(null);
  const [purchaseToolbar, setPurchaseToolbar] = useState<BarberPurchasesEmbeddedToolbarApi | null>(null);

  const registerPkgToolbar = useCallback((api: BarberPackagesEmbeddedToolbarApi | null) => {
    setPkgToolbar(api);
  }, []);

  const registerPurchaseToolbar = useCallback((api: BarberPurchasesEmbeddedToolbarApi | null) => {
    setPurchaseToolbar(api);
  }, []);

  const tab = useMemo(() => parseOffersTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: OffersTab) => {
      const q = new URLSearchParams(searchParams.toString());
      if (next === "packages") q.delete("tab");
      else q.set("tab", "members");
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className={barberPageStackClass}>
      <div className={`print:hidden ${barberOffersHubHeaderShellClass}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className={cn(barberHeaderEnLabelClass, "hidden sm:block")} aria-hidden>
              PACKAGES &amp; MEMBERSHIPS
            </p>
            <h2 className="text-lg font-black leading-snug tracking-tight text-[#1e1b4b] sm:truncate sm:text-xl">
              แพ็กเกจและสมาชิก
            </h2>
          </div>

          {/*
            มือถือ: แท็บเต็มความกว้างด้านบน → ปุ่มหลักเต็มความกว้างด้านล่าง (ไม่บีบมุมขวา)
            เดสก์ท็อป: ปุ่ม + แท็บ แถวเดียวชิดขวา
          */}
          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <nav
              className={cn(barberOffersTabSegmentShellClass, "order-1 w-full min-w-0 sm:order-2 sm:w-auto")}
              aria-label="แท็บแพ็กเกจและสมาชิก"
            >
              <button
                type="button"
                onClick={() => setTab("packages")}
                suppressHydrationWarning
                aria-label="แพ็กเกจ"
                aria-current={tab === "packages" ? "page" : undefined}
                className={tabBtnClass(tab === "packages")}
              >
                <IconPackageTab
                  className={cn(
                    "h-5 w-5 shrink-0 sm:h-5 sm:w-5",
                    tab === "packages" ? "text-white/95" : "text-[#9b97b8]",
                  )}
                />
                <span className={cn("max-w-[5.5rem] text-center sm:max-w-none", tab === "packages" ? "text-white" : "")}>
                  แพ็กเกจ
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("members")}
                suppressHydrationWarning
                aria-label="สมาชิกแพ็กเกจ"
                aria-current={tab === "members" ? "page" : undefined}
                className={tabBtnClass(tab === "members")}
              >
                <IconMembersTab
                  className={cn(
                    "h-5 w-5 shrink-0 sm:h-5 sm:w-5",
                    tab === "members" ? "text-white/95" : "text-[#9b97b8]",
                  )}
                />
                <span className={cn("max-w-[5.5rem] text-center sm:max-w-none", tab === "members" ? "text-white" : "")}>
                  สมาชิก
                </span>
              </button>
            </nav>

            <div className="order-2 flex w-full flex-col gap-2 sm:order-1 sm:w-auto sm:flex-row sm:justify-end">
              {tab === "packages" && pkgToolbar ?
                <button type="button" onClick={() => pkgToolbar.openAddModal()} className={hubPrimaryBtnClass}>
                  เพิ่มแพ็กเกจ
                </button>
              : null}
              {tab === "members" && purchaseToolbar ?
                <button type="button" onClick={() => purchaseToolbar.openSellModal()} className={hubPrimaryBtnClass}>
                  ขายแพ็กเกจ
                </button>
              : null}
            </div>
          </div>
        </div>
      </div>

      {tab === "packages" ? (
        <BarberPackagesClient embedded onEmbeddedToolbar={registerPkgToolbar} />
      ) : (
        <BarberPurchasesClient embedded onEmbeddedToolbar={registerPurchaseToolbar} />
      )}
    </div>
  );
}

export function BarberPackagesHubClient() {
  return (
    <Suspense fallback={<p className={barberMutedLoadingNoticeClass}>กำลังโหลด…</p>}>
      <BarberPackagesHubTabs />
    </Suspense>
  );
}

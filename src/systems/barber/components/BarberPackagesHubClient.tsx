"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppSectionHeader } from "@/components/app-templates";
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
  barberDashboardSegmentBtnClass,
  barberDashboardSegmentShellClass,
  barberMutedLoadingNoticeClass,
  barberPageStackClass,
} from "@/systems/barber/components/barber-ui-tokens";

type OffersTab = "packages" | "members";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconSellPackage({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
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
      <AppSectionHeader
        tone="violet"
        title="แพ็กเกจ"
        className="flex flex-row items-center justify-between gap-2 sm:gap-3"
        actionWrapClassName="min-w-0 shrink-0"
        action={
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {tab === "packages" && pkgToolbar ? (
              <div className={barberDashboardSegmentShellClass} role="group">
                <button
                  type="button"
                  onClick={() => pkgToolbar.openAddModal()}
                  className={barberDashboardSegmentBtnClass(true)}
                  aria-label="เพิ่มแพ็กเกจ"
                >
                  <IconPlus className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">เพิ่มแพ็กเกจ</span>
                </button>
              </div>
            ) : null}
            {tab === "members" && purchaseToolbar ? (
              <div className={barberDashboardSegmentShellClass} role="group">
                <button
                  type="button"
                  onClick={() => purchaseToolbar.openSellModal()}
                  className={barberDashboardSegmentBtnClass(true)}
                  aria-label="ขายแพ็กเกจ"
                >
                  <IconSellPackage className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">ขายแพ็กเกจ</span>
                </button>
              </div>
            ) : null}
            <nav
              className={cn(barberDashboardSegmentShellClass, "max-w-full")}
              aria-label="แท็บแพ็กเกจและสมาชิก"
            >
              <button
                type="button"
                onClick={() => setTab("packages")}
                suppressHydrationWarning
                aria-label="แพ็กเกจ"
                aria-current={tab === "packages" ? "page" : undefined}
                className={barberDashboardSegmentBtnClass(tab === "packages")}
              >
                <IconPackageTab className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">แพ็กเกจ</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("members")}
                suppressHydrationWarning
                aria-label="สมาชิกแพ็กเกจ"
                aria-current={tab === "members" ? "page" : undefined}
                className={barberDashboardSegmentBtnClass(tab === "members")}
              >
                <IconMembersTab className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">สมาชิก</span>
              </button>
            </nav>
          </div>
        }
      />

      <div className="min-w-0">
        {tab === "packages" ? (
          <BarberPackagesClient embedded onEmbeddedToolbar={registerPkgToolbar} />
        ) : (
          <BarberPurchasesClient embedded onEmbeddedToolbar={registerPurchaseToolbar} />
        )}
      </div>
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

"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  massageCardSurfaceRadiusClass,
  massageHorizontalScrollerClass,
  massageNavActiveGradientClass,
  massageNavIdleClass,
} from "@/systems/massage/components/massage-ui-tokens";
import {
  MASSAGE_DASHBOARD_TAB_ITEMS,
  isMassageDashboardTabActive,
  massageDashboardTabIcon,
  massageTabHref,
  parseMassageDashboardTab,
  type MassageDashboardTabKey,
} from "@/systems/massage/massage-module-nav";
import { MassageBookingsClient } from "@/systems/massage/components/MassageBookingsClient";
import { MassageCheckInClient } from "@/systems/massage/components/MassageCheckInClient";
import { MassageTherapistsClient } from "@/systems/massage/components/MassageTherapistsClient";
import { MassageDayScheduleClient } from "@/systems/massage/components/MassageDayScheduleClient";

export type { MassageDashboardTabKey };

/**
 * §12 Dashboard hub TAB TOOLBAR (query params ?tab= queue/checkin/therapists/schedule/overview)
 * เปลี่ยนจาก onClick → `<Link href>` (ตรง hotel/car-wash pattern)
 * Active = brand gradient §4 single source of truth
 */
export function MassageDashboardTabToolbar({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/dashboard/massage";
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseMassageDashboardTab(searchParams.get("tab")),
    [searchParams],
  );
  void tab;

  return (
    <nav
      className={cn("flex shrink-0 justify-end print:hidden", className)}
      aria-label="แท็บแดชบอร์ดร้านนวด"
    >
      <div
        className={cn(
          massageHorizontalScrollerClass,
          `${massageCardSurfaceRadiusClass} border border-white/60 bg-white/40 p-1 backdrop-blur-md sm:flex-wrap justify-end`,
        )}
        role="group"
      >
        {MASSAGE_DASHBOARD_TAB_ITEMS.map((item) => {
          const active = isMassageDashboardTabActive(
            pathname,
            item.key,
            searchParams.get("tab"),
            "overview",
          );
          const icon = massageDashboardTabIcon(item.key);
          return (
            <Link
              key={item.key}
              href={massageTabHref("dashboard", item.key)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              suppressHydrationWarning
              className={cn(
                "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[2rem] px-2 py-2 transition-all sm:min-h-0 sm:min-w-0 sm:gap-1.5 sm:rounded-[1rem] sm:px-3 sm:py-1.5",
                active ? massageNavActiveGradientClass : massageNavIdleClass,
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("h-5 w-5 shrink-0 sm:h-4 sm:w-4")}
                aria-hidden
              >
                {icon}
              </svg>
              <span className="hidden text-xs font-bold sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function MassageDashboardHubTabs({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseMassageDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {tab !== "overview" ? (
        <div className="flex justify-end print:hidden">
          <MassageDashboardTabToolbar />
        </div>
      ) : null}

      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "queue" ? (
        <MassageBookingsClient initialDateKey={initialDateKey} showDashboardBackLink={false} />
      ) : null}
      {tab === "checkin" ? <MassageCheckInClient embedded /> : null}
      {tab === "therapists" ? <MassageTherapistsClient embedded /> : null}
      {tab === "schedule" ? (
        <MassageDayScheduleClient embedded initialDateKey={initialDateKey} />
      ) : null}
    </div>
  );
}

function HubTabsFallback() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy>
      <div className={`h-16 animate-pulse ${massageCardSurfaceRadiusClass} bg-white/25 sm:h-14`} />
    </div>
  );
}

export function MassageDashboardHubClient({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<HubTabsFallback />}>
      <MassageDashboardHubTabs initialDateKey={initialDateKey}>{children}</MassageDashboardHubTabs>
    </Suspense>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  massageCardSurfaceRadiusClass,
  massageHorizontalScrollerClass,
  massageNavActiveGradientClass,
  massageNavIdleClass,
} from "@/systems/massage/components/massage-ui-tokens";
import {
  MASSAGE_DASHBOARD_TAB_ITEMS,
  MASSAGE_STAFF_KIOSK_PATH,
  isMassageDashboardTabActive,
  massageDashboardTabIcon,
  parseMassageDashboardTab,
  type MassageDashboardTabKey,
} from "@/systems/massage/massage-module-nav";
import { MassageBookingsClient } from "@/systems/massage/components/MassageBookingsClient";
import { MassageCheckInClient } from "@/systems/massage/components/MassageCheckInClient";

export type { MassageDashboardTabKey };

/**
 * §12 Dashboard hub TAB TOOLBAR (query params ?tab= queue/checkin/overview)
 * ใช้ pathname ปัจจุบัน — บนลิงก์พนักงานจะอยู่ที่ /dashboard/massage/staff
 */
export function MassageDashboardTabToolbar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/massage";
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseMassageDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = useCallback(
    (next: MassageDashboardTabKey) => {
      const q = new URLSearchParams(searchParams.toString());
      if (next === "overview") q.delete("tab");
      else q.set("tab", next);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              suppressHydrationWarning
              className={cn(
                "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[2rem] px-2 py-2 transition-all sm:min-h-0 sm:min-w-0 sm:gap-1.5 sm:rounded-[1rem] sm:px-3 sm:py-1.5",
                active || tab === item.key ? massageNavActiveGradientClass : massageNavIdleClass,
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MassageDashboardHubTabs({
  initialDateKey,
  children,
  staffLane = false,
}: {
  initialDateKey: string;
  children: React.ReactNode;
  staffLane?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const onStaff = staffLane || pathname === MASSAGE_STAFF_KIOSK_PATH;
  const tab = useMemo(
    () => parseMassageDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  useEffect(() => {
    if (onStaff) return;
    const raw = searchParams.get("tab");
    if (raw === "schedule") {
      router.replace("/dashboard/massage/settings?tab=hours");
      return;
    }
    if (raw === "therapists") {
      router.replace("/dashboard/massage/manage?tab=therapists");
    }
  }, [onStaff, router, searchParams]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {!onStaff && tab !== "overview" ? (
        <div className="flex justify-end print:hidden">
          <MassageDashboardTabToolbar />
        </div>
      ) : null}

      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "queue" ? (
        <MassageBookingsClient
          initialDateKey={initialDateKey}
          showDashboardBackLink={false}
          staffQrLanding={onStaff}
        />
      ) : null}
      {tab === "checkin" ? (
        <MassageCheckInClient embedded staffQrLanding={onStaff} />
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
  staffLane = false,
}: {
  initialDateKey: string;
  children: React.ReactNode;
  staffLane?: boolean;
}) {
  return (
    <Suspense fallback={<HubTabsFallback />}>
      <MassageDashboardHubTabs initialDateKey={initialDateKey} staffLane={staffLane}>
        {children}
      </MassageDashboardHubTabs>
    </Suspense>
  );
}

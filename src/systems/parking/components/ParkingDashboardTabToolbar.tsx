"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  PARKING_DASHBOARD_TAB_ITEMS,
  PARKING_MODULE_PATH_PREFIX,
  parseParkingDashboardTab,
  type ParkingDashboardTabKey,
} from "@/systems/parking/parking-module-nav";
import { parkingPrimaryTabPillClass, parkingPrimaryTabShellClass } from "@/systems/parking/parking-ui-tokens";

function hubTabIcon(key: ParkingDashboardTabKey) {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />;
    case "checkin":
      return (
        <>
          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" />
        </>
      );
    case "booking":
      return (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" strokeLinecap="round" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

export function ParkingDashboardTabToolbar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? PARKING_MODULE_PATH_PREFIX;
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseParkingDashboardTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: ParkingDashboardTabKey) => {
      const q = new URLSearchParams(searchParams.toString());
      if (next === "overview") {
        q.delete("tab");
        q.delete("spot");
      } else {
        q.set("tab", next);
        if (next !== "checkin") q.delete("spot");
      }
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <nav className={cn("flex shrink-0 print:hidden", className)} aria-label="แท็บแดชบอร์ดที่จอดรถ">
      <div className={parkingPrimaryTabShellClass} role="tablist">
        {PARKING_DASHBOARD_TAB_ITEMS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              aria-label={item.label}
              className={cn(
                parkingPrimaryTabPillClass(active),
                "inline-flex min-h-8 items-center gap-1.5 px-2.5 sm:min-h-10 sm:px-3.5",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className={cn("h-4 w-4 shrink-0", active ? "text-white/95" : "text-slate-400")}
                aria-hidden
              >
                {hubTabIcon(item.key)}
              </svg>
              <span className="text-[11px] sm:text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function ParkingDashboardTabToolbarSuspense({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className="h-10 w-56 animate-pulse rounded-2xl bg-white/30" aria-hidden />}>
      <ParkingDashboardTabToolbar className={className} />
    </Suspense>
  );
}

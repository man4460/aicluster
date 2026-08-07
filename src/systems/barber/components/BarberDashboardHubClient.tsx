"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  barberCardSurfaceRadiusClass,
  barberNavActiveClass,
  barberNavIdleClass,
  barberSubTabSegmentShellClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";
import { BarberStylistsClient } from "@/systems/barber/components/BarberStylistsClient";

export type BarberDashboardTabKey = "overview" | "queue" | "checkin" | "stylists";

const TAB_KEYS = new Set<string>(["overview", "queue", "checkin", "stylists"]);

function parseTab(raw: string | null): BarberDashboardTabKey {
  if (raw && TAB_KEYS.has(raw)) return raw as BarberDashboardTabKey;
  return "overview";
}

const TAB_ITEMS: { key: BarberDashboardTabKey; label: string }[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "queue", label: "จัดการคิว" },
  { key: "checkin", label: "เช็กอิน" },
  { key: "stylists", label: "ช่าง" },
];

function hubTabIcon(key: BarberDashboardTabKey) {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "queue":
      return (
        <g>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </g>
      );
    case "checkin":
      return <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
    case "stylists":
      return (
        <g>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 11a3 3 0 106-3 3 3 0 00-3 3" />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

/** ปุ่มสลับแท็บแดชบอร์ด — ใช้คู่แถวหัวข้อสถิติ (ภาพรวม) หรือมุมขวาด้านบนเมื่ออยู่แท็บอื่น */
export function BarberDashboardTabToolbar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/barber";
  const searchParams = useSearchParams();

  const tab = useMemo(
    () => parseTab(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = useCallback(
    (next: BarberDashboardTabKey) => {
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
      aria-label="แท็บแดชบอร์ดร้านตัดผม"
    >
      <div
        className={cn(
          barberSubTabSegmentShellClass,
          "inline-flex max-w-full flex-nowrap items-center justify-end gap-1 overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:flex-wrap",
        )}
        role="group"
      >
        {TAB_ITEMS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              suppressHydrationWarning
              className={cn(
                "flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[2rem] px-2 py-2 transition-all sm:min-h-0 sm:min-w-0 sm:gap-1.5 sm:rounded-[1.25rem] sm:px-3 sm:py-1.5",
                active ? barberNavActiveClass : barberNavIdleClass,
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className={cn("h-5 w-5 shrink-0 sm:h-4 sm:w-4", active ? "text-white/95" : "text-slate-400")}
                aria-hidden
              >
                {hubTabIcon(item.key)}
              </svg>
              <span className={cn("hidden text-xs font-bold sm:inline", active ? "text-white" : "")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BarberDashboardHubTabs({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const tab = useMemo(
    () => parseTab(searchParams.get("tab")),
    [searchParams],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {tab !== "overview" ? (
        <div className="flex justify-end print:hidden">
          <BarberDashboardTabToolbar />
        </div>
      ) : null}

      {tab === "overview" ? <div className="space-y-4 sm:space-y-5">{children}</div> : null}
      {tab === "queue" ? (
        <BarberBookingsClient initialDateKey={initialDateKey} showDashboardBackLink={false} />
      ) : null}
      {tab === "checkin" ? <BarberCheckInClient embedded /> : null}
      {tab === "stylists" ? <BarberStylistsClient embedded /> : null}
    </div>
  );
}

function HubTabsFallback() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy>
      <div className={`h-16 animate-pulse ${barberCardSurfaceRadiusClass} bg-white/25 sm:h-14`} />
    </div>
  );
}

export function BarberDashboardHubClient({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  /** ภาพรวม: สถิติ + คิววันนี้ (ส่งจากหน้าเซิร์ฟเวอร์) */
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<HubTabsFallback />}>
      <BarberDashboardHubTabs initialDateKey={initialDateKey}>{children}</BarberDashboardHubTabs>
    </Suspense>
  );
}

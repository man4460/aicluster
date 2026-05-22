"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { CarWashBookingsClient } from "@/systems/car-wash/CarWashBookingsClient";
import { CarWashDayScheduleClient } from "@/systems/car-wash/CarWashDayScheduleClient";

export type CarWashHubTabKey = "overview" | "queue" | "schedule";

const HUB_TAB_KEYS = new Set<string>(["overview", "queue", "schedule"]);

function parseHubTab(raw: string | null): CarWashHubTabKey {
  if (raw && HUB_TAB_KEYS.has(raw)) return raw as CarWashHubTabKey;
  return "overview";
}

const HUB_TAB_ITEMS: { key: CarWashHubTabKey; label: string }[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "queue", label: "จัดการคิว" },
  { key: "schedule", label: "ตารางเวลา" },
];

function hubTabIcon(key: CarWashHubTabKey) {
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
    case "schedule":
      return (
        <g>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

/** ปุ่มสลับภาพรวม / จัดการคิว / ตารางเวลา — วางคู่หัวข้อสถิติ (แบบร้านนวด) */
export function CarWashDashboardTabToolbar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/car-wash";
  const searchParams = useSearchParams();

  const hubTab = useMemo(() => parseHubTab(searchParams.get("tab")), [searchParams]);

  const setHubTab = useCallback(
    (next: CarWashHubTabKey) => {
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
      aria-label="แท็บภาพรวมคาร์แคร์"
    >
      <div
        className="inline-flex max-w-full flex-nowrap items-center justify-end gap-1 overflow-x-auto rounded-[2rem] border border-white/60 bg-white/40 p-1 backdrop-blur-md max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:flex-wrap"
        role="group"
      >
        {HUB_TAB_ITEMS.map((item) => {
          const active = hubTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setHubTab(item.key)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              suppressHydrationWarning
              className={cn(
                "flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[2rem] px-2 py-2 transition-all sm:min-h-0 sm:min-w-0 sm:gap-1.5 sm:rounded-[1.25rem] sm:px-3 sm:py-1.5",
                active
                  ? "bg-white/80 text-[#5b61ff] shadow-sm ring-1 ring-white/80"
                  : "text-slate-600 hover:bg-white/55 hover:text-slate-900",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className={cn("h-5 w-5 shrink-0 sm:h-4 sm:w-4", active ? "text-[#5b61ff]" : "text-slate-400")}
                aria-hidden
              >
                {hubTabIcon(item.key)}
              </svg>
              <span className="hidden text-xs font-bold sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function CarWashDashboardHubPanels({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const hubTab = useMemo(() => parseHubTab(searchParams.get("tab")), [searchParams]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {hubTab !== "overview" ? (
        <div className="flex justify-end print:hidden">
          <CarWashDashboardTabToolbar />
        </div>
      ) : null}

      {hubTab === "overview" ? <div className="space-y-4 sm:space-y-6">{children}</div> : null}
      {hubTab === "queue" ? (
        <CarWashBookingsClient initialDateKey={initialDateKey} />
      ) : null}
      {hubTab === "schedule" ? (
        <CarWashDayScheduleClient embedded initialDateKey={initialDateKey} />
      ) : null}
    </div>
  );
}

function HubPanelsFallback() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy>
      <div className="h-16 animate-pulse rounded-[2rem] bg-white/25 sm:h-14" />
    </div>
  );
}

export function CarWashDashboardHubClient({
  initialDateKey,
  children,
}: {
  initialDateKey: string;
  /** ภาพรวม: สถิติ + ลานวันนี้ */
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<HubPanelsFallback />}>
      <CarWashDashboardHubPanels initialDateKey={initialDateKey}>{children}</CarWashDashboardHubPanels>
    </Suspense>
  );
}

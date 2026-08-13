"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  carWashNavActiveClass,
  carWashNavIdleClass,
  carWashSubTabSegmentShellClass,
} from "@/systems/car-wash/car-wash-ui-tokens";

export type CarWashHubTabKey = "overview" | "queue";

const HUB_TAB_KEYS = new Set<string>(["overview", "queue"]);

export function parseCarWashHubTab(raw: string | null): CarWashHubTabKey {
  if (raw && HUB_TAB_KEYS.has(raw)) return raw as CarWashHubTabKey;
  return "overview";
}

const HUB_TAB_ITEMS: { key: CarWashHubTabKey; label: string }[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "queue", label: "จัดการคิว" },
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
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

/** ปุ่มสลับภาพรวม / จัดการคิว — วางคู่หัวข้อสถิติ หรือในหัวการ์ดคิว */
export function CarWashDashboardTabToolbar({
  className,
  /** ความสูงเท่าปุ่มแอ็กชันในการ์ด (min-h 44) */
  matchCardActions = false,
}: {
  className?: string;
  matchCardActions?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/car-wash";
  const searchParams = useSearchParams();

  const hubTab = useMemo(() => parseCarWashHubTab(searchParams.get("tab")), [searchParams]);

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
        className={cn(
          carWashSubTabSegmentShellClass,
          "inline-flex max-w-full flex-nowrap items-center justify-end gap-1 overflow-x-auto backdrop-blur-md max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:flex-wrap",
          /* ให้สูงรวมเท่าปุ่มแอ็กชัน (44px) รวม padding บาง ๆ ในเปลือก */
          matchCardActions && "box-border h-[44px] min-h-[44px] gap-0.5 p-0.5",
        )}
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
                "flex shrink-0 items-center justify-center transition-all",
                matchCardActions
                  ? "h-full min-h-0 min-w-[40px] gap-1.5 rounded-[0.65rem] px-2.5 sm:min-w-0 sm:px-3.5"
                  : "min-h-[44px] min-w-[44px] rounded-[2rem] px-2 py-2 sm:min-h-0 sm:min-w-0 sm:gap-1.5 sm:rounded-[1.25rem] sm:px-3 sm:py-1.5",
                active ? carWashNavActiveClass : carWashNavIdleClass,
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className={cn(
                  "shrink-0",
                  matchCardActions ? "h-4 w-4" : "h-5 w-5 sm:h-4 sm:w-4",
                  active ? "text-white/95" : "text-slate-400",
                )}
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

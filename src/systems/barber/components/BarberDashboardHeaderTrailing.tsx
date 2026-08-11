"use client";

import { Suspense, useCallback, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  barberDashboardSegmentShellClass,
  barberDashboardToolsRowClass,
  barberNavActiveClass,
  barberNavIdleClass,
} from "@/systems/barber/components/barber-ui-tokens";

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

/** ปุ่มสลับแท็บแดชบอร์ด — คงชิดขวา */
export function BarberDashboardTabToolbar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/barber";
  const searchParams = useSearchParams();

  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

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
      <div className={barberDashboardSegmentShellClass} role="group">
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
                "inline-flex h-8 min-h-8 min-w-8 shrink-0 items-center justify-center gap-1 rounded-[0.85rem] px-2 leading-none transition-all sm:min-w-0 sm:gap-1.5 sm:px-3",
                active ? barberNavActiveClass : barberNavIdleClass,
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

/**
 * แถวเครื่องมือหัวหน้า: ปุ่มแอ็กชัน (สไตล์เดียวกับเมนู) เรียงซ้ายของเมนู · เมนูแท็บชิดขวาสุด
 * มือถือ: ห่อได้ · เมนูยังชิดขวาในกลุ่ม
 */
export function BarberDashboardHeaderTrailing({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(barberDashboardToolsRowClass, "print:hidden", className)}>
      {children ? (
        <div className={barberDashboardSegmentShellClass} role="group">
          {children}
        </div>
      ) : null}
      <Suspense fallback={<div className="h-10 w-44 animate-pulse rounded-[1.25rem] bg-white/30" aria-hidden />}>
        <BarberDashboardTabToolbar />
      </Suspense>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  FOOTBALL_TURF_TAB_ITEMS,
  footballTurfTabHref,
  footballTurfTabIcon,
  isFootballTurfModulePath,
  isFootballTurfTabActive,
  type FootballTurfTabKey,
} from "@/systems/football-turf/football-turf-module-nav";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full min-w-[3.35rem] flex-col items-center justify-center gap-1 rounded-[1.35rem] px-0.5 py-1.5 text-center transition-all active:scale-90",
    active
      ? cn("text-white shadow-sm", appDashboardBrandGradientFillClass)
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

/** แถบแท็บมือถือ — ใช้ภายใน `FootballTurfMobileBottomChrome` */
export function FootballTurfMobileDockNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  if (!isFootballTurfModulePath(pathname)) return null;

  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul
        className={cn(appMobileDockGridClass, "grid-flow-col auto-cols-[minmax(3.35rem,1fr)]")}
        aria-label="แท็บนำทางสนามฟุตบอล"
      >
        {FOOTBALL_TURF_TAB_ITEMS.map((item) => {
          const active = isFootballTurfTabActive(pathname, item.key as FootballTurfTabKey, tabParam);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={footballTurfTabHref(item.key)}
                className={dockLinkClass(active)}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  aria-hidden
                >
                  {footballTurfTabIcon(item.key)}
                </svg>
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {item.shortLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

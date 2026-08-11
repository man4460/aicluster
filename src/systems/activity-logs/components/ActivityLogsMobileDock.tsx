"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_LOGS_NAV_ITEMS,
  isActivityLogsModulePath,
  isActivityLogsNavItemActive,
  type ActivityLogsNavKey,
} from "@/systems/activity-logs/activity-logs-module-nav";
import { activityLogsNavActiveClass, activityLogsNavIdleClass } from "@/systems/activity-logs/lib/ui-tokens";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? cn(activityLogsNavActiveClass, "!py-2") : activityLogsNavIdleClass,
  );

function IconRecent({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function dockIcon(key: ActivityLogsNavKey, className?: string): ReactNode {
  switch (key) {
    case "recent":
      return <IconRecent className={className} />;
    case "filter":
      return <IconFilter className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

export function ActivityLogsMobileDockNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  if (!isActivityLogsModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-3")} aria-label="แท็บนำทางประวัติกรรม">
      {ACTIVITY_LOGS_NAV_ITEMS.map((item) => {
        const active = isActivityLogsNavItemActive(pathname, item.key, search);
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              {dockIcon(item.key, cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400"))}
              <span className={cn("max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none", active ? "text-white" : "")}>{item.shortLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  APPOINTMENT_QUEUE_NAV_ITEMS,
  isAppointmentQueueModulePath,
  isAppointmentQueueNavItemActive,
  type AppointmentQueueNavKey,
} from "@/systems/appointment-queue/appointment-queue-module-nav";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

function IconBoard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="6" height="16" rx="1.5" />
      <rect x="9" y="4" width="6" height="16" rx="1.5" />
      <rect x="15" y="4" width="6" height="16" rx="1.5" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 2v3M16 2v3M3 9h18" strokeLinecap="round" />
    </svg>
  );
}

function IconService({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3v18M8 7h8M7 12h10M8 17h8" strokeLinecap="round" />
    </svg>
  );
}

function IconStaff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function dockIcon(key: AppointmentQueueNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconBoard className={className} />;
    case "schedule":
      return <IconCalendar className={className} />;
    case "services":
      return <IconService className={className} />;
    case "staff":
      return <IconStaff className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? cn("text-white shadow-md", appDashboardBrandGradientFillClass) : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

export function AppointmentQueueMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isAppointmentQueueModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-5")} aria-label="แท็บนำทางโมดูลจองคิวอัจฉริยะ">
      {APPOINTMENT_QUEUE_NAV_ITEMS.map((item) => {
        const active = isAppointmentQueueNavItemActive(pathname, item.key);
        const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.shortLabel;
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              {dockIcon(item.key, "h-5 w-5 shrink-0")}
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

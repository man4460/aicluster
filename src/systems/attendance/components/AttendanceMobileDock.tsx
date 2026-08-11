"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ATTENDANCE_NAV_ITEMS,
  isAttendanceModulePath,
  isAttendanceNavItemActive,
  type AttendanceNavKey,
} from "@/systems/attendance/attendance-module-nav";
import { attendanceNavActiveClass, attendanceNavIdleClass } from "@/systems/attendance/lib/ui-tokens";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? attendanceNavActiveClass : attendanceNavIdleClass,
  );

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconQr({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v7h-3M14 20h3" strokeLinecap="round" />
    </svg>
  );
}

function dockIcon(key: AttendanceNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "manage":
      return <IconSettings className={className} />;
    case "reports":
      return <IconReport className={className} />;
    case "qr":
      return <IconQr className={className} />;
  }
}

export function AttendanceMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isAttendanceModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทางโมดูลเช็คอินอัจฉริยะ">
      {ATTENDANCE_NAV_ITEMS.map((item) => {
        const active = isAttendanceNavItemActive(pathname, item.key);
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              {dockIcon(item.key, cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400"))}
              <span className={cn("max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none", active ? "text-white" : "")}>
                {item.key === "manage" ? "จัดการ" : item.shortLabel}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

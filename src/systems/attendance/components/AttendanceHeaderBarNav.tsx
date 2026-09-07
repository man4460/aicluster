"use client";

import {
  appDashboardModuleHeaderExpandButtonClass,
  appDashboardModuleHeaderNavLinkClass,
  appDashboardModuleHeaderNavRowClass,
  appDashboardModuleHeaderNavShellClass,
  appDashboardModuleHeaderTitleClass,
} from "@/components/app-templates";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ATTENDANCE_MODULE_DISPLAY_NAME,
  ATTENDANCE_NAV_ITEMS,
  isAttendanceNavItemActive,
  type AttendanceNavKey,
} from "@/systems/attendance/attendance-module-nav";
import type { ReactNode } from "react";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconManage({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function navIcon(key: AttendanceNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "manage":
      return <IconManage className={className} />;
    case "reports":
      return <IconReport className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

/** ปุ่มขยายหัวโมดูล — มือถือใช้เมื่อซ่อนหัว (ไม่มีแท็บใน header) */
export function AttendanceHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <ExpandGlyph />
    </button>
  );
}

/** แถบเมนูใน header หลักเมื่อย่อหัวโมดูล — เดสก์ท็อปเท่านั้น */
export function AttendanceHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลเช็คอินอัจฉริยะ"
      >
        {ATTENDANCE_NAV_ITEMS.map((item) => {
          const active = isAttendanceNavItemActive(pathname, item.key);
          const shortLbl =
            item.key === "manage" ? "จัดการ" : item.shortLabel;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={appDashboardModuleHeaderNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                {navIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{shortLbl}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {ATTENDANCE_MODULE_DISPLAY_NAME}
      </span>
      <AttendanceHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

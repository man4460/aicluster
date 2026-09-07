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
import { AdminHubMenuIcon } from "@/components/admin/AdminHubMenuIcons";
import {
  ADMIN_HUB_DISPLAY_NAME,
  ADMIN_HUB_MENU_ORDER,
  isAdminHubNavActive,
} from "@/lib/admin-hub-nav";

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

/** ปุ่มขยายหัวศูนย์แอดมิน — มือถือใช้เมื่อซ่อนหัว */
export function AdminHubHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวศูนย์แอดมิน"
      title="แสดงส่วนหัวศูนย์แอดมิน"
      suppressHydrationWarning
    >
      <ExpandGlyph />
    </button>
  );
}

/** แถบเมนูใน header หลักเมื่อย่อหัวศูนย์แอดมิน — เดสก์ท็อป */
export function AdminHubHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูศูนย์แอดมิน"
      >
        {ADMIN_HUB_MENU_ORDER.map((item) => {
          const active = isAdminHubNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={appDashboardModuleHeaderNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <AdminHubMenuIcon name={item.icon} className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{item.dockLabel}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {ADMIN_HUB_DISPLAY_NAME}
      </span>
      <AdminHubHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

"use client";

import {
  appDashboardModuleHeaderExpandButtonClass,
  appDashboardModuleHeaderNavLinkClass,
  appDashboardModuleHeaderNavRowClass,
  appDashboardModuleHeaderNavShellClass,
  appDashboardModuleHeaderTitleClass,
} from "@/components/app-templates";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import {
  LMS_MODULE_DISPLAY_NAME,
  LMS_NAV_ITEMS,
  lmsModuleNavIcon,
  isLmsModuleNavItemActive,
} from "@/systems/lms/lms-module-nav";

function LmsHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function LmsHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <LmsHeaderExpandGlyph />
    </button>
  );
}

function LmsHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลLMS คอร์สออนไลน์"
      >
        {LMS_NAV_ITEMS.map((item) => {
          const active = isLmsModuleNavItemActive(pathname, item.key);
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
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  {lmsModuleNavIcon(item.key)}
                </svg>
              </span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {LMS_MODULE_DISPLAY_NAME}
      </span>
      <LmsHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

/** แถบเมนูหลักใน header ม่วงเมื่อย่อหัวโมดูล */
export function LmsHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <LmsHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}

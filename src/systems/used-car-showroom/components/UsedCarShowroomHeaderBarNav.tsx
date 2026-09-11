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
  USED_CAR_SHOWROOM_MODULE_DISPLAY_NAME,
  USED_CAR_SHOWROOM_NAV_ITEMS,
  usedCarShowroomModuleNavIcon,
  isUsedCarShowroomModuleNavItemActive,
} from "@/systems/used-car-showroom/used-car-showroom-module-nav";

function UsedCarShowroomHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function UsedCarShowroomHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <UsedCarShowroomHeaderExpandGlyph />
    </button>
  );
}

function UsedCarShowroomHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลโชว์รูมรถมือสอง"
      >
        {USED_CAR_SHOWROOM_NAV_ITEMS.map((item) => {
          const active = isUsedCarShowroomModuleNavItemActive(pathname, item.key);
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
                  {usedCarShowroomModuleNavIcon(item.key)}
                </svg>
              </span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {USED_CAR_SHOWROOM_MODULE_DISPLAY_NAME}
      </span>
      <UsedCarShowroomHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

/** แถบเมนูหลักใน header ม่วงเมื่อย่อหัวโมดูล */
export function UsedCarShowroomHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <UsedCarShowroomHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}

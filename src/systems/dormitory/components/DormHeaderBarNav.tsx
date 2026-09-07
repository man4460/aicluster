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
import { Suspense } from "react";
import {
  DORMITORY_MODULE_DISPLAY_NAME,
  DORMITORY_NAV_ITEMS,
  isDormitoryNavItemActive,
  dormitoryNavIcon,
  type DormitoryNavKey,
} from "@/systems/dormitory/dormitory-module-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function navIcon(key: DormitoryNavKey, className?: string) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      {dormitoryNavIcon(key)}
    </svg>
  );
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function DormHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

function DormHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลหอพัก"
      >
        {DORMITORY_NAV_ITEMS.map((item) => {
          const active = isDormitoryNavItemActive(pathname, item.key);
          const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.shortLabel;
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
                {item.key === "settings" ? (
                  <IconModuleShopSettings className="h-3.5 w-3.5" />
                ) : (
                  navIcon(item.key, "h-3.5 w-3.5")
                )}
              </span>
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {DORMITORY_MODULE_DISPLAY_NAME}
      </span>
      <DormHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

export function DormHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <DormHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}

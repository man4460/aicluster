"use client";

import {
  appDashboardModuleHeaderExpandButtonClass,
  appDashboardModuleHeaderNavLinkClass,
  appDashboardModuleHeaderNavRowClass,
  appDashboardModuleHeaderNavShellClass,
  appDashboardModuleHeaderTitleClass,
} from "@/components/app-templates";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  CAR_WASH_MODULE_DISPLAY_NAME,
  CAR_WASH_NAV_ITEMS,
  isCarWashNavItemActive,
  type CarWashNavKey,
} from "@/systems/car-wash/car-wash-module-nav";
import { carWashTabIcon } from "@/systems/car-wash/car-wash-module-nav";
import {
  ModuleShopSettingsDesktopNavLink,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function navIcon(key: CarWashNavKey, className?: string) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      {carWashTabIcon(key)}
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

export function CarWashHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

function CarWashHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลคาร์แคร์"
      >
        {CAR_WASH_NAV_ITEMS.map((item) => {
          const active = isCarWashNavItemActive(pathname, item.key, tabParam);
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
                {navIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {CAR_WASH_MODULE_DISPLAY_NAME}
      </span>
      <CarWashHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

export function CarWashHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <CarWashHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}

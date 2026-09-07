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
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";
import {
  BARBER_MODULE_DISPLAY_NAME,
  BARBER_NAV_ITEMS,
  barberModuleNavIcon,
  isBarberModuleNavItemActive,
  type BarberModuleNavKey,
} from "@/systems/barber/barber-module-nav";

function navIcon(key: BarberModuleNavKey, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {barberModuleNavIcon(key)}
    </svg>
  );
}

function BarberHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function BarberHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <BarberHeaderExpandGlyph />
    </button>
  );
}

export function BarberHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลร้านตัดผม"
      >
        {BARBER_NAV_ITEMS.map((item) => {
          const active = isBarberModuleNavItemActive(pathname, item.key);
          const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label;
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
        {BARBER_MODULE_DISPLAY_NAME}
      </span>
      <BarberHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

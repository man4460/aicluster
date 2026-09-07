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
  ECOMMERCE_STORE_MODULE_DISPLAY_NAME,
  ECOMMERCE_STORE_NAV_ITEMS,
  isEcommerceStoreNavItemActive,
  type EcommerceStoreNavKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  IconClipboard,
  IconFinance,
  IconSettings,
  IconStore,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

function navIcon(key: EcommerceStoreNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconStore className={className} />;
    case "finance":
      return <IconFinance className={className} />;
    case "manage":
      return <IconClipboard className={className} />;
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

export function EcommerceStoreHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

export function EcommerceStoreHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลร้านออนไลน์"
      >
        {ECOMMERCE_STORE_NAV_ITEMS.map((item) => {
          const active = isEcommerceStoreNavItemActive(pathname, item.key);
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
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {ECOMMERCE_STORE_MODULE_DISPLAY_NAME}
      </span>
      <EcommerceStoreHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

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
  SCHOOL_BANK_MODULE_DISPLAY_NAME,
  SCHOOL_BANK_NAV_ITEMS,
  isSchoolBankNavItemActive,
  type SchoolBankNavKey,
} from "@/systems/school-bank/school-bank-module-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function IconBank({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
      <path d="M9 22V12h6v10" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: SchoolBankNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconBank className={className} />;
    case "members":
      return <IconUsers className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function SchoolBankHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

export function SchoolBankHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลธนาคารโรงเรียน"
      >
        {SCHOOL_BANK_NAV_ITEMS.map((item) => {
          const active = isSchoolBankNavItemActive(pathname, item.key);
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
        {SCHOOL_BANK_MODULE_DISPLAY_NAME}
      </span>
      <SchoolBankHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

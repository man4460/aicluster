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
  INVENTORY_MODULE_DISPLAY_NAME,
  INVENTORY_NAV_ITEMS,
  inventoryNavActive,
  type InventoryNavKey,
} from "@/systems/inventory/inventory-module-nav";

function inventoryHeaderIcon(key: InventoryNavKey, className?: string) {
  let glyph: React.ReactNode;
  if (key === "overview") {
    glyph = (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>
    );
  } else if (key === "items") {
    glyph = (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
        <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
        <path d="M12 13v8" />
      </>
    );
  } else if (key === "warehouses") {
    glyph = (
      <>
        <path d="M3 9 12 4l9 5v11H3z" strokeLinejoin="round" />
        <path d="M7 20v-7h10v7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-3h4v3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  } else {
    glyph = <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />;
  }
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
      {glyph}
    </svg>
  );
}

function InventoryHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function InventoryHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <InventoryHeaderExpandGlyph />
    </button>
  );
}

export function InventoryHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลคลังสต๊อกสินค้า"
      >
        {INVENTORY_NAV_ITEMS.map((item) => {
          const active = inventoryNavActive(pathname, item.href);
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
                {inventoryHeaderIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {INVENTORY_MODULE_DISPLAY_NAME}
      </span>
      <InventoryHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

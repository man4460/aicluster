"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  AppMobileDockShell,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ECOMMERCE_STORE_NAV_ITEMS,
  isEcommerceStoreModulePath,
  isEcommerceStoreNavItemActive,
  type EcommerceStoreNavKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  IconFinance,
  IconPackage,
  IconSettings,
  IconStore,
  IconUsers,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

function dockIcon(key: EcommerceStoreNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconStore className={className} />;
    case "finance":
      return <IconFinance className={className} />;
    case "products":
      return <IconPackage className={className} />;
    case "crm":
      return <IconUsers className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

export function EcommerceStoreMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isEcommerceStoreModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-5")} aria-label="แท็บนำทางโมดูลร้านออนไลน์">
      {ECOMMERCE_STORE_NAV_ITEMS.map((item) => {
        const active = isEcommerceStoreNavItemActive(pathname, item.key);
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={appMobileDockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              {dockIcon(item.key, "h-5 w-5 shrink-0")}
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                {item.shortLabel}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function EcommerceStoreMobileDock() {
  return (
    <AppMobileDockShell ariaLabel="เมนูล่างร้านออนไลน์">
      <EcommerceStoreMobileDockNav />
    </AppMobileDockShell>
  );
}

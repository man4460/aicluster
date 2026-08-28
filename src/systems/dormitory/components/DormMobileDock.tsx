"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  DORMITORY_NAV_ITEMS,
  isDormitoryModulePath,
  isDormitoryNavItemActive,
  dormitoryNavIcon,
  type DormitoryNavKey,
} from "@/systems/dormitory/dormitory-module-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";
import { dormNavActiveClass, dormNavIdleClass } from "@/systems/dormitory/lib/ui-tokens";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? cn(dormNavActiveClass, "ring-1 ring-white/40")
      : dormNavIdleClass,
  );

function dockIcon(key: DormitoryNavKey, className?: string): ReactNode {
  if (key === "settings") {
    return <IconModuleShopSettings className={className} />;
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      {dormitoryNavIcon(key)}
    </svg>
  );
}

export function DormMobileDockNav() {
  const pathname = usePathname() ?? "";

  if (!isDormitoryModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทางโมดูลหอพัก">
      {DORMITORY_NAV_ITEMS.map((item) => {
        const active = isDormitoryNavItemActive(pathname, item.key);
        const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.shortLabel;
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              {dockIcon(item.key, "h-5 w-5 shrink-0")}
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                {label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

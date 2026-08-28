"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  CAR_WASH_NAV_ITEMS,
  isCarWashNavItemActive,
  isCarWashModulePath,
  carWashTabIcon,
  type CarWashNavKey,
} from "@/systems/car-wash/car-wash-module-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";
import { carWashNavActiveClass, carWashNavIdleClass } from "@/systems/car-wash/car-wash-ui-tokens";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? cn(carWashNavActiveClass, "ring-1 ring-white/40")
      : carWashNavIdleClass,
  );

function dockIcon(key: CarWashNavKey, className?: string): ReactNode {
  if (key === "settings") {
    return <IconModuleShopSettings className={className} />;
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      {carWashTabIcon(key)}
    </svg>
  );
}

export function CarWashMobileDockNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  if (!isCarWashModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทางโมดูลคาร์แคร์">
      {CAR_WASH_NAV_ITEMS.map((item) => {
        const active = isCarWashNavItemActive(pathname, item.key, tabParam);
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

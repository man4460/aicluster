"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  HOTEL_RESORT_NAV_ITEMS,
  isHotelResortModulePath,
  isHotelResortNavItemActive,
  type HotelResortNavKey,
} from "@/systems/hotel-resort/hotel-resort-module-nav";
import {
  IconCalendar,
  IconDoorOpen,
  IconHotel,
  IconNavCheckIn,
  IconNavFinance,
} from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function dockIcon(key: HotelResortNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconHotel className={className} />;
    case "rooms":
      return <IconDoorOpen className={className} />;
    case "bookings":
      return <IconCalendar className={className} />;
    case "checkIn":
      return <IconNavCheckIn className={className} />;
    case "finance":
      return <IconNavFinance className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

export function HotelResortMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isHotelResortModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-6")} aria-label="แท็บนำทางโมดูลโรงแรมรีสอร์ท">
      {HOTEL_RESORT_NAV_ITEMS.map((item) => {
        const active = isHotelResortNavItemActive(pathname, item.key);
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
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

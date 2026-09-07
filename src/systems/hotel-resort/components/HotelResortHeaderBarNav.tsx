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
  HOTEL_RESORT_MODULE_DISPLAY_NAME,
  HOTEL_RESORT_NAV_ITEMS,
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

function navIcon(key: HotelResortNavKey, className?: string) {
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

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

/** ปุ่มขยายหัวโมดูล — มือถือใช้เมื่อซ่อนหัว (ไม่มีแท็บใน header) */
export function HotelResortHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

/** แถบเมนูใน header หลักเมื่อย่อหัวโมดูล — เดสก์ท็อปเท่านั้น */
export function HotelResortHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลโรงแรมรีสอร์ท"
      >
        {HOTEL_RESORT_NAV_ITEMS.map((item) => {
          const active = isHotelResortNavItemActive(pathname, item.key);
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
        {HOTEL_RESORT_MODULE_DISPLAY_NAME}
      </span>
      <HotelResortHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

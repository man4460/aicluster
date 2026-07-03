"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  IconCalendar,
  IconHotel,
  IconNavCheckIn,
  IconNavFinance,
  IconNavGuest,
} from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

const base = "/dashboard/hotel-resort";
const settingsHref = `${base}/settings`;

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

type Item = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  active: boolean;
};

export function HotelResortMobileDockNav() {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  if (!pathname.startsWith(base)) return null;

  const isSettings = pathname.endsWith(settingsHref);

  const items: Item[] = [
    { href: base, label: "ห้องพัก", icon: IconHotel, active: !isSettings && pathname === base },
    { href: `${base}/bookings`, label: "จอง", icon: IconCalendar, active: !isSettings && pathname.endsWith(`${base}/bookings`) },
    { href: `${base}/check-in`, label: "เช็คอิน", icon: IconNavCheckIn, active: !isSettings && pathname.endsWith(`${base}/check-in`) },
    { href: `${base}/finance`, label: "การเงิน", icon: IconNavFinance, active: !isSettings && pathname.endsWith(`${base}/finance`) },
    { href: `${base}/guest-portal`, label: "ลูกค้า", icon: IconNavGuest, active: !isSettings && pathname.endsWith(`${base}/guest-portal`) },
  ];

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-6")} aria-label="แท็บนำทางโมดูลโรงแรมรีสอร์ท">
      {items.map((item) => (
        <li key={item.href} className="min-w-0">
          <Link href={item.href} className={dockLinkClass(item.active)} aria-current={item.active ? "page" : undefined}>
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{item.label}</span>
          </Link>
        </li>
      ))}
      <li className="min-w-0">
        <Link
          href={settingsHref}
          className={dockLinkClass(isSettings)}
          aria-current={isSettings ? "page" : undefined}
          aria-label="ตั้งค่าร้าน"
        >
          <IconModuleShopSettings className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
            {MODULE_SHOP_SETTINGS_SHORT_LABEL}
          </span>
        </Link>
      </li>
    </ul>
  );
}

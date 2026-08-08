"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { HotelResortMobileBottomProvider } from "@/systems/hotel-resort/components/HotelResortMobileBottomChrome";
import {
  HOTEL_RESORT_HEADER_COLLAPSE_EVENT,
  HOTEL_RESORT_MODULE_DISPLAY_NAME,
  HOTEL_RESORT_NAV_ITEMS,
  isHotelResortNavItemActive,
  readHotelResortHeaderCollapsed,
  writeHotelResortHeaderCollapsed,
  type HotelResortNavKey,
} from "@/systems/hotel-resort/hotel-resort-module-nav";
import {
  hotelResortAccentBarClass,
  hotelResortGlassShellClass,
  hotelResortMainPaddingBottomClass,
  hotelResortNavActiveClass,
  hotelResortNavIdleClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import {
  IconCalendar,
  IconDoorOpen,
  IconHotel,
  IconNavCheckIn,
  IconNavFinance,
  IconNavGuest,
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
    case "guest":
      return <IconNavGuest className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

function TabLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active ? hotelResortNavActiveClass : hotelResortNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function HotelResortShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readHotelResortHeaderCollapsed());
    sync();
    window.addEventListener(HOTEL_RESORT_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOTEL_RESORT_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeHotelResortHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <HotelResortMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            hotelResortGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={hotelResortAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <IconHotel className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {HOTEL_RESORT_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
                aria-label="คู่มือการใช้งาน"
                aria-haspopup="dialog"
                aria-expanded={usageGuideOpen}
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือการใช้งาน</span>
              </button>
              <button
                type="button"
                onClick={toggleHeaderCollapse}
                className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-pressed={headerCollapsed}
                aria-label="ซ่อนส่วนหัวโมดูล"
                title="ซ่อนส่วนหัวโมดูล"
                suppressHydrationWarning
              >
                <HeaderCollapseGlyph collapsed={false} />
              </button>
            </div>
          </div>

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลโรงแรมรีสอร์ท"
          >
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {HOTEL_RESORT_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label}
                    active={isHotelResortNavItemActive(pathname, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือโรงแรม / รีสอร์ท"
          subtitle="แดชบอร์ด ห้องพัก จอง เช็คอิน การเงิน และลิงก์ QR"
          sections={[
            {
              title: "เมนูหลัก",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>แท็บเมนูอยู่ในส่วนหัว — กดซ่อนเพื่อย้ายไปแถบบน (คอมพิวเตอร์) หรือเหลือเมนูล่าง (มือถือ)</li>
                  <li>มือถือใช้ dock ด้านล่างสลับหน้าตามแพทเทิร์นคาร์แคร์</li>
                </ul>
              ),
            },
            {
              title: "แดชบอร์ด",
              content: <p>สถิติและผังห้อง — จองหรือเช็คอินจากปุ่มบนการ์ดห้อง</p>,
            },
            {
              title: "ห้องพัก",
              content: <p>จัดการอาคาร/ตึกหลายแห่ง · ประเภทห้อง · เพิ่มแก้ไขลบห้อง</p>,
            },
            {
              title: "จอง / เช็คอิน",
              content: <p>หน้าจองสำหรับงานล่วงหน้า · หน้าเช็คอินอัปโหลดรูปบัตรประชาชนและรับชำระ</p>,
            },
            {
              title: "การเงิน / ลิงก์",
              content: <p>รายรับ–ต้นทุน · QR พร้อมเพย์ · แชร์ลิงก์พอร์ทัลให้ลูกค้าตรวจสถานะ</p>,
            },
          ]}
        />

        <div className={cn(hotelResortMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </HotelResortMobileBottomProvider>
  );
}

"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortMobileBottomProvider } from "@/systems/hotel-resort/components/HotelResortMobileBottomChrome";
import {
  ModuleShopSettingsDesktopNavLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";
import {
  hotelResortGlassShellClass,
  hotelResortGradientTitleClass,
  hotelResortMainPaddingBottomClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import {
  IconCalendar,
  IconHotel,
  IconNavCheckIn,
  IconNavFinance,
  IconNavGuest,
} from "@/systems/hotel-resort/components/HotelResortIcons";

const base = "/dashboard/hotel-resort";
const settingsHref = `${base}/settings`;

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
        active
          ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
          : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-[#5b61ff]" : "text-slate-400")} aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function HotelResortShell({ children }: { children: ReactNode }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const onModule = pathname.startsWith(base);

  const isBookings = pathname.endsWith(`${base}/bookings`);
  const isCheckIn = pathname.endsWith(`${base}/check-in`);
  const isFinance = pathname.endsWith(`${base}/finance`);
  const isGuest = pathname.endsWith(`${base}/guest-portal`);
  const isSettings = pathname.endsWith(settingsHref);
  const isRooms = onModule && !isBookings && !isCheckIn && !isFinance && !isGuest && !isSettings;

  return (
    <HotelResortMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header className={`${hotelResortGlassShellClass} shrink-0 flex flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden`}>
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-100">
                <IconHotel className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className={cn("text-xl font-black tracking-tight sm:text-2xl", hotelResortGradientTitleClass)}>โรงแรม / รีสอร์ท</h1>
              </div>
            </div>
            <HotelResortButton
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/45 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
              aria-label="คู่มือการใช้งาน"
              aria-haspopup="dialog"
              aria-expanded={usageGuideOpen}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </HotelResortButton>
          </div>
          <nav className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden" aria-label="เมนูโมดูลโรงแรมรีสอร์ท">
            <ul className="grid grid-cols-6 gap-1">
              <li><TabLink href={base} label="ห้องพัก" active={isRooms} icon={<IconHotel className="h-4 w-4" />} /></li>
              <li><TabLink href={`${base}/bookings`} label="จอง" active={isBookings} icon={<IconCalendar className="h-4 w-4" />} /></li>
              <li><TabLink href={`${base}/check-in`} label="เช็คอิน" active={isCheckIn} icon={<IconNavCheckIn className="h-4 w-4" />} /></li>
              <li><TabLink href={`${base}/finance`} label="การเงิน" active={isFinance} icon={<IconNavFinance className="h-4 w-4" />} /></li>
              <li><TabLink href={`${base}/guest-portal`} label="ลูกค้า" active={isGuest} icon={<IconNavGuest className="h-4 w-4" />} /></li>
              {moduleShopSettingsDesktopNavItem(
                <ModuleShopSettingsDesktopNavLink href={settingsHref} active={isSettings} />,
              )}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือโรงแรม / รีสอร์ท"
          subtitle="ห้องพัก จอง เช็คอิน การเงิน และพอร์ทัลลูกค้า"
          sections={[
            {
              title: "เมนูหลัก",
              content: <p>เดสก์ท็อปใช้แท็บบน 5 เมนู ส่วนมือถือใช้ dock ด้านล่างตามแพทเทิร์นคาร์แคร์.</p>,
            },
            {
              title: "ห้องพัก",
              content: <p>ดูสถานะห้องแบบการ์ด, กรองตามสถานะ, และแตะห้องเพื่อไปจัดการการจองได้ทันที.</p>,
            },
            {
              title: "จอง / เช็คอิน",
              content: <p>หน้าจองใช้สำหรับงานล่วงหน้า ส่วนหน้าเช็คอินรองรับ walk-in และอัปโหลดรูปบัตรประชาชน.</p>,
            },
            {
              title: "การเงิน / ลูกค้า",
              content: <p>ติดตามรายรับต้นทุน, สร้าง QR พร้อมเพย์ และแชร์ QR พอร์ทัลให้ลูกค้าตรวจสอบสถานะ.</p>,
            },
          ]}
        />

        <div
          className={cn(
            hotelResortMainPaddingBottomClass,
            appModuleShellMainScrollClass,
          )}
        >
          {children}
        </div>
      </div>
    </HotelResortMobileBottomProvider>
  );
}

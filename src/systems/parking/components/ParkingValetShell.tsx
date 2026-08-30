"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppMobileDockShell, appMobileDockGridClass, AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  PARKING_HEADER_COLLAPSE_EVENT,
  PARKING_MODULE_DISPLAY_NAME,
  PARKING_NAV_ITEMS,
  isParkingNavItemActive,
  readParkingHeaderCollapsed,
  writeParkingHeaderCollapsed,
  type ParkingNavKey,
} from "@/systems/parking/parking-module-nav";
import {
  parkingDockItemActiveClass,
  parkingDockItemIdleClass,
  parkingIconBadgeClass,
  parkingModuleHeaderShellClass,
  parkingNavItemActiveClass,
  parkingNavItemBase,
  parkingNavItemIdleClass,
} from "@/systems/parking/parking-ui-tokens";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function IconOffers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" strokeLinecap="round" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .65.37 1.25.97 1.55z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ICONS: Record<ParkingNavKey, typeof IconDashboard> = {
  dashboard: IconDashboard,
  offers: IconOffers,
  finance: IconFinance,
  settings: IconGear,
};

function ParkingHeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

const parkingGuideSections = [
  {
    title: "แดชบอร์ด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ภาพรวม · สถานะช่อง (ว่าง / มีการจอง / มีรถจอด) · เช็คอินพนักงาน · จองล่วงหน้า</li>
      </ul>
    ),
  },
  {
    title: "การจัดการ",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>แพ็กเกจบริการ · สมาชิกเหมาจ่าย — ตัดสิทธิ์ตอนเช็คอิน</li>
        <li>เพิ่มลาน · ตั้งราคาชม./วัน/เดือน · จัดการช่องจอดและ QR ในแต่ละลาน</li>
      </ul>
    ),
  },
  {
    title: "การเงิน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>สรุปรายรับจากรอบจอดที่ชำระแล้ว และดูประวัติเซสชัน</li>
      </ul>
    ),
  },
  {
    title: "ตั้งค่า",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ตั้งค่าพื้นฐานและการเงินของลานหลัก · ลิงก์ / QR</li>
      </ul>
    ),
  },
];

export function ParkingValetShell({
  siteName,
  children,
}: {
  siteName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [guideOpen, setGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readParkingHeaderCollapsed());
    sync();
    window.addEventListener(PARKING_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PARKING_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeader = useCallback(() => {
    writeParkingHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 pb-24 sm:gap-6 sm:pb-6">
        <div className={cn(parkingModuleHeaderShellClass, "print:hidden", headerCollapsed && "hidden")}>
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className={parkingIconBadgeClass}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                      <path d="M3 14h2l2-3h10l2 3h2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                      <path d="M5 14l1.5-5h11L19 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">โมดูลจอดรถ</p>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">{PARKING_MODULE_DISPLAY_NAME}</h1>
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#66638c]">{siteName}</p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleHeader}
                  className="inline-flex h-10 min-h-[40px] w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/55 text-[#4d47b6] shadow-sm backdrop-blur-md transition hover:bg-white/75 active:scale-95"
                  aria-expanded={!headerCollapsed}
                  aria-label={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                  title={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                  suppressHydrationWarning
                >
                  <ParkingHeaderCollapseGlyph />
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setGuideOpen(true)}
                  className="flex h-10 min-h-[40px] items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 text-sm font-semibold text-[#4d47b6] shadow-sm backdrop-blur-md transition hover:bg-white/75 sm:px-4"
                  aria-label="เปิดคู่มือการใช้งาน"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1" />
                  </svg>
                  <span className="hidden sm:inline">คู่มือ</span>
                </button>
              </div>
            </div>
          </header>

          <nav aria-label="เมนูโมดูลรับฝากจอดรถ" className="mt-5 hidden border-t border-white/50 pt-5 md:block">
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {PARKING_NAV_ITEMS.map((item) => {
                const active = isParkingNavItemActive(pathname, item.key);
                const Icon = NAV_ICONS[item.key];
                return (
                  <li key={item.href} className="min-w-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(parkingNavItemBase, active ? parkingNavItemActiveClass : parkingNavItemIdleClass)}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>

      <AppMobileDockShell ariaLabel="เมนูล่างรับฝากจอดรถ">
        <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
          {PARKING_NAV_ITEMS.map((item) => {
            const active = isParkingNavItemActive(pathname, item.key);
            const Icon = NAV_ICONS[item.key];
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all active:scale-90",
                    active ? parkingDockItemActiveClass : parkingDockItemIdleClass,
                  )}
                  title={item.label}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                  <span className="max-w-full truncate px-0.5 text-[9px] font-black leading-none">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือการใช้งาน — บริการรับฝากจอดรถ"
        subtitle="แดชบอร์ด · การจัดการ · การเงิน · ตั้งค่า"
        sections={parkingGuideSections}
      />
    </div>
  );
}

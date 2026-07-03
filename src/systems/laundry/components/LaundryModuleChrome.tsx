"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import {
  AppMobileDockShell,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LaundryUsageGuideModal } from "@/systems/laundry/components/LaundryUsageGuideModal";
import {
  LAUNDRY_SETTINGS_PATH,
  LAUNDRY_STAFF_PATH,
  LAUNDRY_TAB_ITEMS,
  isLaundrySettingsActive,
  isLaundryTabActive,
  laundryTabHref,
  type LaundryTabKey,
} from "@/systems/laundry/laundry-module-nav";
import {
  ModuleShopSettingsDesktopNavLink,
  ModuleShopSettingsDockLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";

const laundryModuleGlassShellClass = cn(
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
  "p-4 sm:px-8 sm:py-6 print:hidden",
);

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[13px] font-black transition-all",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function LaundryTabIcon({ tabKey }: { tabKey: LaundryTabKey }) {
  switch (tabKey) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "packages":
      return (
        <>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
        </>
      );
  }
}

function LaundryModuleChromeInner({ children }: { children: ReactNode }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const staffKiosk = pathname === LAUNDRY_STAFF_PATH;
  const onSettings = isLaundrySettingsActive(pathname);

  if (staffKiosk) {
    return <div className="flex min-w-0 flex-col gap-4 sm:gap-6">{children}</div>;
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <div className={laundryModuleGlassShellClass}>
        <header>
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-[#5b61ff] text-white shadow-lg shadow-indigo-100"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 3v18M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" opacity="0.35" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">รับฝากซักผ้า</h1>
                <p className="mt-0.5 hidden text-xs font-semibold text-slate-500 sm:block">
                  รับผ้าที่บ้าน · ซัก/อบ/รีด · ส่งคืนลูกค้า
                </p>
              </div>
            </div>
            <button
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
            </button>
          </div>
        </header>

        <nav aria-label="เมนูซักผ้า" className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LAUNDRY_TAB_ITEMS.map((item) => {
              const active = !onSettings && isLaundryTabActive(pathname, item.key, tabParam);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={laundryTabHref(item.key)} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      <LaundryTabIcon tabKey={item.key} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            {moduleShopSettingsDesktopNavItem(
              <ModuleShopSettingsDesktopNavLink href={LAUNDRY_SETTINGS_PATH} active={onSettings} />,
            )}
          </ul>
        </nav>
      </div>

      <LaundryUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างรับฝากซักผ้า">
        <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
          {LAUNDRY_TAB_ITEMS.map((item) => {
            const active = !onSettings && isLaundryTabActive(pathname, item.key, tabParam);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={laundryTabHref(item.key)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    <LaundryTabIcon tabKey={item.key} />
                  </svg>
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0">
            <ModuleShopSettingsDockLink href={LAUNDRY_SETTINGS_PATH} active={onSettings} />
          </li>
        </ul>
      </AppMobileDockShell>
    </div>
  );
}

/** หัวโมดูล + เมนู — ใช้ทั้งหน้าแดชบอร์ดและตั้งค่า */
export function LaundryModuleChrome({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>}>
      <LaundryModuleChromeInner>{children}</LaundryModuleChromeInner>
    </Suspense>
  );
}

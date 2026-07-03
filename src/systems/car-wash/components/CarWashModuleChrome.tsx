"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  AppMobileDockShell,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  CAR_WASH_SETTINGS_PATH,
  CAR_WASH_TAB_ITEMS,
  carWashTabHref,
  carWashTabIcon,
  isCarWashSettingsActive,
  isCarWashTabActive,
} from "@/systems/car-wash/car-wash-module-nav";
import {
  ModuleShopSettingsDesktopNavLink,
  ModuleShopSettingsDockLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";

const carWashModuleGlassShellClass = cn(
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
  "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
  "sm:px-8 sm:py-6 print:hidden",
);

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function CarWashModuleChromeInner({ children }: { children: ReactNode }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const onSettings = isCarWashSettingsActive(pathname);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <div className={carWashModuleGlassShellClass}>
        <header>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#f06dc8] text-white shadow-lg shadow-indigo-100"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                    <path d="M3 14h2l2-3h10l2 3h2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                    <path d="M5 14l1.5-5h11L19 14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">คาร์แคร์</h1>
                  <p className="hidden text-xs font-bold text-slate-500 md:block">ระบบจัดการลานล้างและแพ็กเกจสมาชิก</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav aria-label="เมนูคาร์แคร์" className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden">
          <ul className="flex gap-1">
            {CAR_WASH_TAB_ITEMS.map((item) => {
              const active = !onSettings && isCarWashTabActive(pathname, item.key, tabParam);
              return (
                <li key={item.key} className="min-w-0 flex-1">
                  <Link href={carWashTabHref(item.key)} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")}
                      aria-hidden
                    >
                      {carWashTabIcon(item.key)}
                    </svg>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {moduleShopSettingsDesktopNavItem(
              <ModuleShopSettingsDesktopNavLink href={CAR_WASH_SETTINGS_PATH} active={onSettings} />,
            )}
          </ul>
        </nav>
      </div>

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างคาร์แคร์">
        <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
          {CAR_WASH_TAB_ITEMS.map((item) => {
            const active = !onSettings && isCarWashTabActive(pathname, item.key, tabParam);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={carWashTabHref(item.key)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {carWashTabIcon(item.key)}
                  </svg>
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0">
            <ModuleShopSettingsDockLink href={CAR_WASH_SETTINGS_PATH} active={onSettings} />
          </li>
        </ul>
      </AppMobileDockShell>
    </div>
  );
}

/** หัวโมดูล + เมนู — ใช้บนหน้าตั้งค่า (แดชบอร์ดหลักมี chrome ใน CarWashDashboard) */
export function CarWashModuleChrome({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>}>
      <CarWashModuleChromeInner>{children}</CarWashModuleChromeInner>
    </Suspense>
  );
}

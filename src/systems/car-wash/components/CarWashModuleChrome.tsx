"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AppMobileDockShell,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  CAR_WASH_HEADER_COLLAPSE_EVENT,
  CAR_WASH_SETTINGS_PATH,
  CAR_WASH_TAB_ITEMS,
  carWashTabHref,
  carWashTabIcon,
  isCarWashSettingsActive,
  isCarWashTabActive,
  readCarWashHeaderCollapsed,
  writeCarWashHeaderCollapsed,
} from "@/systems/car-wash/car-wash-module-nav";
import {
  ModuleShopSettingsDesktopNavLink,
  ModuleShopSettingsDockLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";
import {
  carWashAccentBarClass,
  carWashContentStackClass,
  carWashHeaderCollapseBtnClass,
  carWashHeaderEnLabelClass,
  carWashHeaderToolbarGroupClass,
  carWashMainPaddingBottomClass,
  carWashModuleIconBadgeClass,
  carWashNavActiveClass,
  carWashNavIdleClass,
  carWashShellWrapperClass,
} from "@/systems/car-wash/car-wash-ui-tokens";

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
    active ? carWashNavActiveClass : carWashNavIdleClass,
  );

const CAR_WASH_MODULE_LABEL = "โมดูล";

function CarWashHeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

function CarWashModuleChromeInner({ children }: { children: ReactNode }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const onSettings = isCarWashSettingsActive(pathname);

  const [headerCollapsed, setHeaderCollapsed] = useState(readCarWashHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readCarWashHeaderCollapsed());
    sync();
    window.addEventListener(CAR_WASH_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CAR_WASH_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeader = useCallback(() => {
    writeCarWashHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col", carWashContentStackClass, carWashMainPaddingBottomClass)}>
      <header
        className={cn(carWashShellWrapperClass, headerCollapsed && "hidden")}
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className={carWashModuleIconBadgeClass} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                    <path d="M3 14h2l2-3h10l2 3h2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                    <path d="M5 14l1.5-5h11L19 14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6] sm:block" aria-hidden>
                    {CAR_WASH_MODULE_LABEL}
                  </p>
                  <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl" id="car-wash-module-title">
                    คาร์แคร์
                  </h1>
                </div>
              </div>
            </div>
            <div className={carWashHeaderToolbarGroupClass}>
              <button
                type="button"
                onClick={toggleHeader}
                className={cn("inline-flex", carWashHeaderCollapseBtnClass)}
                aria-expanded={!headerCollapsed}
                aria-label={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                title={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                suppressHydrationWarning
              >
                <CarWashHeaderCollapseGlyph />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className={carWashAccentBarClass} aria-hidden />
        </div>

        <nav
          aria-label="เมนูคาร์แคร์"
          className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
        >
          <ul className="flex gap-1">
            {CAR_WASH_TAB_ITEMS.map((item) => {
              const active = !onSettings && isCarWashTabActive(pathname, item.key, tabParam);
              return (
                <li key={item.key} className="min-w-0 flex-1">
                  <Link
                    href={carWashTabHref(item.key)}
                    className={navLinkClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className={cn("h-4 w-4 shrink-0", active ? "text-white/95" : "text-slate-400")}
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
      </header>

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
                  className={cn(
                    appMobileDockLinkClass(active),
                    active ? carWashNavActiveClass : "",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className={cn("h-5 w-5 shrink-0", active ? "text-white/95" : "")}
                    aria-hidden
                  >
                    {carWashTabIcon(item.key)}
                  </svg>
                  <span
                    className={cn(
                      "max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none",
                      active ? "text-white" : "",
                    )}
                  >
                    {item.shortLabel}
                  </span>
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
    <Suspense
      fallback={
        <div
          className={cn("flex min-w-0 flex-col", carWashContentStackClass, carWashMainPaddingBottomClass)}
        >
          {children}
        </div>
      }
    >
      <CarWashModuleChromeInner>{children}</CarWashModuleChromeInner>
    </Suspense>
  );
}

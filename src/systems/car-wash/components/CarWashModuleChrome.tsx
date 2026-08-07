"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
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
import {
  CAR_WASH_HEADER_COLLAPSED_KEY,
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

const CAR_WASH_MODULE_EN_LABEL = "CAR WASH";

function CarWashHeaderChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 transition-transform duration-200", expanded ? "" : "rotate-180")}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CarWashModuleChromeInner({ children }: { children: ReactNode }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const onSettings = isCarWashSettingsActive(pathname);

  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [headerPrefHydrated, setHeaderPrefHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAR_WASH_HEADER_COLLAPSED_KEY);
      if (raw === "1") setHeaderCollapsed(true);
    } catch {
      /* no-op */
    }
    setHeaderPrefHydrated(true);
  }, []);

  const toggleHeader = () => {
    const next = !headerCollapsed;
    setHeaderCollapsed(next);
    try {
      localStorage.setItem(CAR_WASH_HEADER_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* no-op */
    }
  };

  return (
    <div className={cn("flex min-w-0 flex-col", carWashContentStackClass, carWashMainPaddingBottomClass)}>
      <div className={carWashShellWrapperClass}>
        <header>
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
                  <p className={cn(carWashHeaderEnLabelClass, "hidden sm:block")} aria-hidden>
                    {CAR_WASH_MODULE_EN_LABEL}
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
                aria-label={headerCollapsed ? "แสดงเมนูหัวโมดูล" : "ซ่อนเมนูหัวโมดูล"}
                aria-expanded={headerCollapsed ? "false" : "true"}
                aria-controls="car-wash-desktop-nav-section"
                suppressHydrationWarning
              >
                {headerPrefHydrated ? (
                  <CarWashHeaderChevron expanded={!headerCollapsed} />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>
        <div className="mt-5">
          <div className={carWashAccentBarClass} aria-hidden />
        </div>

        {!headerCollapsed ? (
          <nav
            id="car-wash-desktop-nav-section"
            aria-label="เมนูคาร์แคร์"
            className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden"
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
        ) : null}
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

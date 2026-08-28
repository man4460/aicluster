"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  BUILDING_POS_MAIN_TABS,
  BUILDING_POS_SETTINGS_HREF,
  buildingPosMainTabHref,
  buildingPosPathFlags,
  isBuildingPosModulePath,
  isBuildingPosNavItemActive,
  parseBuildingPosNav,
  type BuildingPosMainTab,
} from "@/systems/building-pos/building-pos-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function IconOrder({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M6 3h12v4H6zM7 7v13h10V7" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h4" strokeLinecap="round" />
    </svg>
  );
}

function IconQueue({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconOverview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
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

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />
    </svg>
  );
}

function dockIcon(key: BuildingPosMainTab, className?: string) {
  switch (key) {
    case "order":
      return <IconOrder className={className} />;
    case "orders":
      return <IconQueue className={className} />;
    case "overview":
      return <IconOverview className={className} />;
    case "finance":
      return <IconFinance className={className} />;
    case "menu":
      return <IconMenu className={className} />;
  }
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-[1.35rem] px-0.5 py-1.5 text-center transition-all active:scale-90",
    active
      ? cn("text-white shadow-sm", appDashboardBrandGradientFillClass)
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function BuildingPosMobileDockNavInner() {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "") || "/";
  const searchParams = useSearchParams();
  const nav = parseBuildingPosNav(searchParams);
  const flags = buildingPosPathFlags(pathname);

  if (!flags.onModule) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-6")} aria-label="แท็บนำทาง POS ร้านอาหาร">
      {BUILDING_POS_MAIN_TABS.map(({ key, label }) => {
        const active = isBuildingPosNavItemActive(pathname, searchParams, key);
        const href = buildingPosMainTabHref(nav, key);
        return (
          <li key={key} className="min-w-0">
            <Link
              href={href}
              scroll={false}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              title={label}
            >
              {dockIcon(key, "h-5 w-5 shrink-0")}
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                {label}
              </span>
            </Link>
          </li>
        );
      })}
      <li className="min-w-0">
        <Link
          href={BUILDING_POS_SETTINGS_HREF}
          className={dockLinkClass(flags.isSettings)}
          aria-current={flags.isSettings ? "page" : undefined}
          aria-label="ตั้งค่าร้าน"
          title="ตั้งค่าร้าน"
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

/** แถบแท็บ — ใช้ภายใน `BuildingPosMobileBottomChrome` */
export function BuildingPosMobileDockNav() {
  return (
    <Suspense fallback={null}>
      <BuildingPosMobileDockNavInner />
    </Suspense>
  );
}

/** สำรองถ้าไม่ได้ห่อด้วย MobileBottomProvider */
export function BuildingPosMobileDock() {
  const pathname = usePathname() ?? "";
  if (!isBuildingPosModulePath(pathname)) return null;
  return (
    <AppMobileDockShell ariaLabel="เมนูล่าง POS ร้านอาหาร">
      <BuildingPosMobileDockNav />
    </AppMobileDockShell>
  );
}

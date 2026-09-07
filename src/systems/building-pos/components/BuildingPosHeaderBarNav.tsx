"use client";

import {
  appDashboardModuleHeaderExpandButtonClass,
  appDashboardModuleHeaderNavLinkClass,
  appDashboardModuleHeaderNavRowClass,
  appDashboardModuleHeaderNavShellClass,
  appDashboardModuleHeaderTitleClass,
} from "@/components/app-templates";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BUILDING_POS_DISPLAY_NAME,
  BUILDING_POS_MAIN_TABS,
  BUILDING_POS_SETTINGS_HREF,
  buildingPosMainTabHref,
  isBuildingPosNavItemActive,
  parseBuildingPosNav,
  type BuildingPosMainTab,
} from "@/systems/building-pos/building-pos-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

function tabIcon(key: BuildingPosMainTab, className?: string) {
  if (key === "order") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
        <path d="M6 3h12v4H6zM7 7v13h10V7" strokeLinejoin="round" />
        <path d="M9 11h6M9 15h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (key === "orders") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
      </svg>
    );
  }
  if (key === "overview") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
        <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (key === "finance") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
        <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />
    </svg>
  );
}

/** ปุ่มขยายหัวโมดูล — มือถือใช้เมื่อซ่อนหัว */
export function BuildingPosHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

function BuildingPosHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const searchParams = useSearchParams();
  const pathname = (usePathname() ?? "").replace(/\/+$/, "") || "/";
  const nav = parseBuildingPosNav(searchParams);
  const onSettings = isBuildingPosNavItemActive(pathname, searchParams, "settings");

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูล POS ร้านอาหาร"
      >
        {BUILDING_POS_MAIN_TABS.map((item) => {
          const active = isBuildingPosNavItemActive(pathname, searchParams, item.key);
          return (
            <Link
              key={item.key}
              href={buildingPosMainTabHref(nav, item.key)}
              scroll={false}
              className={appDashboardModuleHeaderNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              {tabIcon(item.key, "h-3.5 w-3.5")}
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={BUILDING_POS_SETTINGS_HREF}
          className={appDashboardModuleHeaderNavLinkClass(onSettings)}
          aria-current={onSettings ? "page" : undefined}
          aria-label="ตั้งค่า"
          title="ตั้งค่า"
        >
          <IconModuleShopSettings className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{MODULE_SHOP_SETTINGS_SHORT_LABEL}</span>
        </Link>
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {BUILDING_POS_DISPLAY_NAME}
      </span>
      <BuildingPosHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

/** แถบเมนูใน header หลักเมื่อย่อหัวโมดูล — เดสก์ท็อป */
export function BuildingPosHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <BuildingPosHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}

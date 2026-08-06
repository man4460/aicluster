"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
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
  if (key === "qr") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
        <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
        <path d="M15 15h2v2M19 15h2v2M15 19h2M19 19h2" strokeLinecap="round" />
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
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
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูโมดูล POS ร้านอาหาร"
      >
        {BUILDING_POS_MAIN_TABS.map((item) => {
          const active = isBuildingPosNavItemActive(pathname, searchParams, item.key);
          return (
            <Link
              key={item.key}
              href={buildingPosMainTabHref(nav, item.key)}
              scroll={false}
              className={cn(
                "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black transition-all sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs",
                active
                  ? "bg-white text-[#4d47b6] shadow-md"
                  : "text-white/85 hover:bg-white/15 hover:text-white",
              )}
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
          className={cn(
            "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black transition-all sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs",
            onSettings
              ? "bg-white text-[#4d47b6] shadow-md"
              : "text-white/85 hover:bg-white/15 hover:text-white",
          )}
          aria-current={onSettings ? "page" : undefined}
          aria-label="ตั้งค่า"
          title="ตั้งค่า"
        >
          <IconModuleShopSettings className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{MODULE_SHOP_SETTINGS_SHORT_LABEL}</span>
        </Link>
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
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

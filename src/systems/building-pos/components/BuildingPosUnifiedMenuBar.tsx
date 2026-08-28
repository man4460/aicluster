"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import {
  BUILDING_POS_MAIN_TABS,
  BUILDING_POS_SETTINGS_HREF,
  buildingPosMainTabHref,
  isBuildingPosNavItemActive,
  parseBuildingPosNav,
  type BuildingPosMainTab,
} from "@/systems/building-pos/building-pos-nav";
import {
  buildingPosModuleGlassShellClass,
  buildingPosNavActiveClass,
  buildingPosNavIdleClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
import { IconModuleShopSettings } from "@/systems/module-shop/module-shop-settings-nav";

function buildingPosMainTabIcon(key: BuildingPosMainTab) {
  if (key === "order")
    return (
      <>
        <path d="M6 3h12v4H6zM7 7v13h10V7" strokeLinejoin="round" />
        <path d="M9 11h6M9 15h4" strokeLinecap="round" />
      </>
    );
  if (key === "orders")
    return <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />;
  if (key === "overview")
    return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
  if (key === "finance") return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <>
      <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />
    </>
  );
}

function TabLink({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active ? buildingPosNavActiveClass : buildingPosNavIdleClass,
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

function BuildingPosUnifiedMenuBarInner({
  variant,
  className,
}: {
  variant: "standalone" | "embedded";
  className?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = (usePathname() ?? "").replace(/\/+$/, "") || "/";
  const nav = parseBuildingPosNav(searchParams);
  const onSettings = isBuildingPosNavItemActive(pathname, searchParams, "settings");

  const embedded = variant === "embedded";

  return (
    <nav
      aria-label="เมนูหลัก POS ร้านอาหาร (แท็บเล็กขึ้นไป)"
      className={cn(
        "hidden lg:block print:hidden",
        embedded ?
          "mt-5 border-t border-[#e8e6fc]/70 pt-5"
        : `${buildingPosModuleGlassShellClass} p-3 sm:p-4`,
        className,
      )}
    >
      {!embedded ?
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-[#66638c] sm:mb-3">เมนูหลัก</p>
      : null}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {BUILDING_POS_MAIN_TABS.map(({ key, label }) => {
          const active = isBuildingPosNavItemActive(pathname, searchParams, key);
          const href = buildingPosMainTabHref(nav, key);
          return (
            <li key={key} className="min-w-0">
              <TabLink
                href={href}
                label={label}
                active={active}
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="h-4 w-4"
                    aria-hidden
                  >
                    {buildingPosMainTabIcon(key)}
                  </svg>
                }
              />
            </li>
          );
        })}
        <li className="min-w-0">
          <TabLink
            href={BUILDING_POS_SETTINGS_HREF}
            label="ตั้งค่า"
            active={onSettings}
            icon={<IconModuleShopSettings className="h-4 w-4" />}
          />
        </li>
      </ul>
    </nav>
  );
}

/** เมนูหลัก — มือถือใช้ `BuildingPosMobileDock` · `embedded` = อยู่ในการ์ดหัวระบบ */
export function BuildingPosUnifiedMenuBar(props?: { variant?: "standalone" | "embedded"; className?: string }) {
  const variant = props?.variant ?? "standalone";
  const className = props?.className;
  return (
    <Suspense fallback={null}>
      <BuildingPosUnifiedMenuBarInner variant={variant} className={className} />
    </Suspense>
  );
}

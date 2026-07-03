"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import {
  buildingPosMainTabHref,
  parseBuildingPosNav,
  type BuildingPosMainTab,
} from "@/systems/building-pos/building-pos-nav";
import { buildingPosModuleGlassShellClass } from "@/systems/building-pos/components/building-pos-ui-tokens";
import {
  ModuleShopSettingsDesktopNavLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";

const BUILDING_POS_SETTINGS_HREF = "/dashboard/building-pos/settings";

function buildingPosMainTabIcon(key: BuildingPosMainTab) {
  if (key === "overview")
    return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
  if (key === "qr")
    return (
      <>
        <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
        <path d="M15 15h2v2M19 15h2v2M15 19h2M19 19h2" strokeLinecap="round" />
      </>
    );
  if (key === "finance") return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <>
      <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />
    </>
  );
}

const navItemDesktopClass = (active: boolean) =>
  cn(
    "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function BuildingPosUnifiedMenuBarInner({
  variant,
  className,
}: {
  variant: "standalone" | "embedded";
  className?: string;
}) {
  const searchParams = useSearchParams();
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const nav = parseBuildingPosNav(searchParams);
  const onSettings = pathname === BUILDING_POS_SETTINGS_HREF;

  const tabs: { key: BuildingPosMainTab; label: string }[] = [
    { key: "overview", label: "แดชบอร์ด" },
    { key: "finance", label: "การเงิน" },
    { key: "menu", label: "เมนู" },
    { key: "qr", label: "QR" },
  ];

  const embedded = variant === "embedded";

  return (
    <nav
      aria-label="เมนูหลัก POS ร้านอาหาร (แท็บเล็กขึ้นไป)"
      className={cn(
        "hidden lg:block print:hidden",
        embedded ?
          "mt-5 border-t border-white/40 pt-5"
        : `${buildingPosModuleGlassShellClass} p-3 sm:p-4`,
        className,
      )}
    >
      {!embedded ?
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-[#66638c] sm:mb-3">เมนูหลัก</p>
      : null}
      <ul className="flex gap-1">
        {tabs.map(({ key, label }) => {
          const active = !onSettings && nav.main === key;
          const href = buildingPosMainTabHref(nav, key);
          return (
            <li key={key} className="min-w-0 flex-1">
              <Link href={href} scroll={false} className={navItemDesktopClass(active)} aria-current={active ? "page" : undefined}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")}
                  aria-hidden
                >
                  {buildingPosMainTabIcon(key)}
                </svg>
                {label}
              </Link>
            </li>
          );
        })}
        {moduleShopSettingsDesktopNavItem(
          <ModuleShopSettingsDesktopNavLink href={BUILDING_POS_SETTINGS_HREF} active={onSettings} />,
        )}
      </ul>
    </nav>
  );
}

/** เมนูหลัก 4 กลุ่ม — มือถือใช้ `BuildingPosMobileDock` · `embedded` = อยู่ในการ์ดหัวระบบ (เทียบคาร์แคร์) */
export function BuildingPosUnifiedMenuBar(props?: { variant?: "standalone" | "embedded"; className?: string }) {
  const variant = props?.variant ?? "standalone";
  const className = props?.className;
  return (
    <Suspense fallback={null}>
      <BuildingPosUnifiedMenuBarInner variant={variant} className={className} />
    </Suspense>
  );
}

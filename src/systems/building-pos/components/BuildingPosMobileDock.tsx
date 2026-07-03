"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { buildingPosMainTabHref, parseBuildingPosNav, type BuildingPosMainTab } from "@/systems/building-pos/building-pos-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

const BUILDING_POS_BASE = "/dashboard/building-pos";
const BUILDING_POS_SETTINGS_HREF = `${BUILDING_POS_BASE}/settings`;

function IconOverview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconQr({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
      <path d="M15 15h2v2M19 15h2v2M15 19h2M19 19h2" strokeLinecap="round" />
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

/** เทียบ `CarWashDashboard` เมนูล่างมือถือ + `BarberModuleMobileDock` — ไอคอน + ชื่อเมนู text-[9px] font-black */
const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function BuildingPosMobileDockInner() {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const searchParams = useSearchParams();
  const nav = parseBuildingPosNav(searchParams);
  const onHub = pathname === BUILDING_POS_BASE;
  const onSettings = pathname === BUILDING_POS_SETTINGS_HREF;

  if (!onHub && !onSettings) return null;

  const items: { main: BuildingPosMainTab; label: string; icon: typeof IconOverview }[] = [
    { main: "overview", label: "แดชบอร์ด", icon: IconOverview },
    { main: "finance", label: "การเงิน", icon: IconFinance },
    { main: "menu", label: "เมนู", icon: IconMenu },
    { main: "qr", label: "QR", icon: IconQr },
  ];

  return (
    <AppMobileDockShell ariaLabel="เมนูล่าง POS ร้านอาหาร">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {items.map(({ main, label, icon: Icon }) => {
          const active = !onSettings && nav.main === main;
          const href = buildingPosMainTabHref(nav, main);
          return (
            <li key={main} className="min-w-0">
              <Link
                href={href}
                scroll={false}
                className={dockLinkClass(active)}
                aria-current={active ? "page" : undefined}
                title={label}
              >
                <Icon className="h-5 w-5 shrink-0" />
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
            className={dockLinkClass(onSettings)}
            aria-current={onSettings ? "page" : undefined}
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
    </AppMobileDockShell>
  );
}

export function BuildingPosMobileDock() {
  return (
    <Suspense fallback={null}>
      <BuildingPosMobileDockInner />
    </Suspense>
  );
}

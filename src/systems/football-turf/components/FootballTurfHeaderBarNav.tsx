"use client";

import {
  appDashboardModuleHeaderExpandButtonClass,
  appDashboardModuleHeaderNavLinkClass,
  appDashboardModuleHeaderNavRowClass,
  appDashboardModuleHeaderNavShellClass,
  appDashboardModuleHeaderTitleClass,
} from "@/components/app-templates";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FOOTBALL_TURF_MODULE_DISPLAY_NAME,
  FOOTBALL_TURF_TAB_ITEMS,
  footballTurfTabHref,
  footballTurfTabIcon,
  isFootballTurfTabActive,
} from "@/systems/football-turf/football-turf-module-nav";

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

/** ปุ่มขยายหัวโมดูล — มือถือใช้เมื่อซ่อนหัว (ไม่มีแท็บใน header) */
export function FootballTurfHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
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

/** แถบเมนูใน header หลักเมื่อย่อหัวโมดูล — เดสก์ท็อปเท่านั้น */
export function FootballTurfHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลสนามฟุตบอล"
      >
        {FOOTBALL_TURF_TAB_ITEMS.map((item) => {
          const active = isFootballTurfTabActive(pathname, item.key, tabParam);
          return (
            <Link
              key={item.key}
              href={footballTurfTabHref(item.key)}
              className={appDashboardModuleHeaderNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  {footballTurfTabIcon(item.key)}
                </svg>
              </span>
              <span className="hidden xl:inline">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {FOOTBALL_TURF_MODULE_DISPLAY_NAME}
      </span>
      <FootballTurfHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

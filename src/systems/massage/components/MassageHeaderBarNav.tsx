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
import { Suspense } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";
import {
  MASSAGE_MODULE_DISPLAY_NAME,
  MASSAGE_NAV_ITEMS,
  isMassageModuleNavItemActive,
  massageModuleNavIcon,
  type MassageModuleNavKey,
} from "@/systems/massage/massage-module-nav";

function navIcon(key: MassageModuleNavKey, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {massageModuleNavIcon(key)}
    </svg>
  );
}

/** §12 Expand glyph (shorten last line = visual cue = compact/hidden state) */
function MassageHeaderExpandGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden
    >
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

/** §12 ปุ่มแสดงหัวโมดูล (เมื่อซ่อนแล้ว) — style บนสีม่วง global header */
export function MassageHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <MassageHeaderExpandGlyph />
    </button>
  );
}

function MassageHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  void tabParam;

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนูโมดูลร้านนวด"
      >
        {MASSAGE_NAV_ITEMS.map((item) => {
          const active = isMassageModuleNavItemActive(pathname, item.key);
          const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={appDashboardModuleHeaderNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                {navIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {MASSAGE_MODULE_DISPLAY_NAME}
      </span>
      <MassageHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

export function MassageHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <MassageHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}

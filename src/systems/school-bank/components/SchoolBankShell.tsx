"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { SchoolBankMobileBottomProvider } from "@/systems/school-bank/components/SchoolBankMobileBottomChrome";
import {
  SCHOOL_BANK_HEADER_COLLAPSE_EVENT,
  SCHOOL_BANK_MODULE_DISPLAY_NAME,
  SCHOOL_BANK_NAV_ITEMS,
  isSchoolBankNavItemActive,
  readSchoolBankHeaderCollapsed,
  writeSchoolBankHeaderCollapsed,
  type SchoolBankNavKey,
} from "@/systems/school-bank/school-bank-module-nav";
import {
  schoolBankAccentBarClass,
  schoolBankGlassShellClass,
  schoolBankMainPaddingBottomClass,
  schoolBankNavActiveClass,
  schoolBankNavIdleClass,
  schoolBankOutlineButtonClass,
} from "@/systems/school-bank/lib/ui-tokens";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function IconBank({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
      <path d="M9 22V12h6v10" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: SchoolBankNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconBank className={className} />;
    case "members":
      return <IconUsers className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

function TabLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active ? schoolBankNavActiveClass : schoolBankNavIdleClass,
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

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {collapsed ? (
        <path d="M6 9l6 6 6-6" />
      ) : (
        <path d="M6 15l6-6 6 6" />
      )}
    </svg>
  );
}

const guideSections = [
  {
    title: "ภาพรวม",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ดูยอดรวม จำนวนบัญชี และประวัติล่าสุด</li>
        <li>กด «ทำรายการ» เพื่อฝากหรือถอนให้นักเรียน</li>
      </ul>
    ),
  },
  {
    title: "บัญชี",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>เพิ่มบัญชีด้วยรหัสนักเรียนและชื่อ — แยกตามห้องได้</li>
        <li>ยอดคงเหลืออัปเดตทุกครั้งที่มีรายการ</li>
      </ul>
    ),
  },
];

export function SchoolBankShell({
  children,
}: {
  siteName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readSchoolBankHeaderCollapsed());
    sync();
    window.addEventListener(SCHOOL_BANK_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCHOOL_BANK_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeSchoolBankHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <SchoolBankMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            schoolBankGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={schoolBankAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                  <path d="M18 12a2 2 0 00-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {SCHOOL_BANK_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className={cn(schoolBankOutlineButtonClass, "w-9 px-0 sm:w-auto sm:px-2.5")}
                aria-label="คู่มือการใช้งาน"
                aria-haspopup="dialog"
                aria-expanded={usageGuideOpen}
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือ</span>
              </button>
              <button
                type="button"
                onClick={toggleHeaderCollapse}
                className={cn(schoolBankOutlineButtonClass, "w-9 px-0")}
                aria-pressed={headerCollapsed}
                aria-label="ซ่อนส่วนหัวโมดูล"
                title="ซ่อนส่วนหัวโมดูล"
                suppressHydrationWarning
              >
                <HeaderCollapseGlyph collapsed={headerCollapsed} />
              </button>
            </div>
          </div>

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลธนาคารโรงเรียน"
          >
            <ul className="grid grid-cols-3 gap-2">
              {SCHOOL_BANK_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label}
                    active={isSchoolBankNavItemActive(pathname, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือ — ธนาคารโรงเรียน"
          sections={guideSections}
        />

        <div className={cn(schoolBankMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </SchoolBankMobileBottomProvider>
  );
}

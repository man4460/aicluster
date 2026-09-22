"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AppMobileDockShell,
  AppUsageGuideModal,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  SMART_GUARD_TOUR_HEADER_COLLAPSE_EVENT,
  SMART_GUARD_TOUR_MODULE_DISPLAY_NAME,
  SMART_GUARD_TOUR_NAV_ITEMS,
  smartGuardTourModuleNavIcon,
  isSmartGuardTourModuleNavItemActive,
  readSmartGuardTourHeaderCollapsed,
  writeSmartGuardTourHeaderCollapsed,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";

const shellClass = cn(
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
  "print:hidden",
);

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active
      ? "bg-orange-50 text-orange-800 ring-1 ring-orange-100"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  );

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

function SmartGuardTourModuleChromeInner({
  children,
  shopName,
}: {
  children: ReactNode;
  shopName?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readSmartGuardTourHeaderCollapsed());
    sync();
    window.addEventListener(SMART_GUARD_TOUR_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SMART_GUARD_TOUR_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeSmartGuardTourHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header
        className={cn(shellClass, "flex flex-col px-4 py-4 sm:px-6 sm:py-5", headerCollapsed && "hidden")}
      >
        <div className="flex flex-row flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-orange-500 text-white shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path
                  d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M9.5 12l1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {SMART_GUARD_TOUR_MODULE_DISPLAY_NAME}
              </h1>
              {shopName ? (
                <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{shopName}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-9 min-h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white text-xs font-semibold text-orange-800 shadow-sm transition hover:bg-slate-50 active:scale-95 sm:w-auto sm:gap-2 sm:px-3"
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
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </button>
            <button
              type="button"
              onClick={toggleHeaderCollapse}
              className="inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-lg border border-orange-200 bg-white text-orange-800 shadow-sm transition hover:bg-slate-50 active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
              suppressHydrationWarning
            >
              <HeaderCollapseGlyph collapsed={false} />
            </button>
          </div>
        </div>

        <nav aria-label="เมนูโมดูลธุรกิจ รปภ." className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SMART_GUARD_TOUR_NAV_ITEMS.map((item) => {
              const active = isSmartGuardTourModuleNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      {smartGuardTourModuleNavIcon(item.key)}
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือ — โมดูล ธุรกิจ รปภ."
        subtitle="แดชบอร์ด · จัดการ · การเงิน · ตั้งค่า"
        sections={[
          {
            title: "เริ่มต้น",
            content: (
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-orange-700">
                <li>ตั้งค่าพื้นฐาน · การเงิน · เวลาเปิด</li>
                <li>เพิ่มจุดตรวจ · พนักงาน · ตาราง</li>
                <li>แชร์ลิงก์จากแท็บลิงก์</li>
              </ol>
            ),
          },
          {
            title: "เมนู",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-orange-700">
                <li>แดชบอร์ด — สถิติ · สายตรวจ · กะ · เหตุการณ์</li>
                <li>จัดการ — จุดตรวจ · ตาราง · พนักงาน · อุปกรณ์</li>
                <li>การเงิน — รายรับ · รายจ่าย</li>
                <li>ตั้งค่า — พื้นฐาน · เว็บ · ลิงก์ · เชื่อมระบบ</li>
              </ul>
            ),
          },
        ]}
      />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างโมดูลธุรกิจ รปภ.">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {SMART_GUARD_TOUR_NAV_ITEMS.map((item) => {
            const active = isSmartGuardTourModuleNavItemActive(pathname, item.key);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {smartGuardTourModuleNavIcon(item.key)}
                  </svg>
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                    {item.shortLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>
    </div>
  );
}

export function SmartGuardTourModuleChrome({
  children,
  shopName,
}: {
  children: ReactNode;
  shopName?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>
      }
    >
      <SmartGuardTourModuleChromeInner shopName={shopName}>{children}</SmartGuardTourModuleChromeInner>
    </Suspense>
  );
}

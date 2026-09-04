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
  LMS_HEADER_COLLAPSE_EVENT,
  LMS_MODULE_DISPLAY_NAME,
  LMS_NAV_ITEMS,
  lmsModuleNavIcon,
  isLmsModuleNavItemActive,
  readLmsHeaderCollapsed,
  writeLmsHeaderCollapsed,
} from "@/systems/lms/lms-module-nav";

const lmsModuleShellClass = cn(
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
  "print:hidden",
);

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active
      ? "bg-indigo-50 text-[#5b61ff] ring-1 ring-indigo-100"
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

function LmsModuleChromeInner({
  children,
  schoolName,
}: {
  children: ReactNode;
  schoolName?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readLmsHeaderCollapsed());
    sync();
    window.addEventListener(LMS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LMS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeLmsHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header
        className={cn(
          lmsModuleShellClass,
          "flex flex-col px-4 py-4 sm:px-6 sm:py-5",
          headerCollapsed && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-[#5b61ff] text-white shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {LMS_MODULE_DISPLAY_NAME}
              </h1>
              {schoolName ? (
                <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{schoolName}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-9 min-h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0000BF]/25 bg-white text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-slate-50 active:scale-95 sm:w-auto sm:gap-2 sm:px-3"
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
              className="inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-lg border border-[#0000BF]/25 bg-white text-[#4d47b6] shadow-sm transition hover:bg-slate-50 active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
              suppressHydrationWarning
            >
              <HeaderCollapseGlyph collapsed={false} />
            </button>
          </div>
        </div>

        <nav aria-label="เมนูLMS คอร์สออนไลน์" className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LMS_NAV_ITEMS.map((item) => {
              const active = isLmsModuleNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      {lmsModuleNavIcon(item.key)}
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
        title="คู่มือการใช้งาน — LMS คอร์สออนไลน์"
        subtitle="แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า · เว็บสาธารณะ"
        sections={[
          {
            title: "เมนูหลัก (4 รายการ)",
            content: (
              <ul className="list-disc space-y-1 pl-4">
                <li>แดชบอร์ด — กำหนดการ · ย้อนหลัง · โครงสร้างกรรมการ</li>
                <li>การเงิน — รายรับ/รายจ่าย + สลิป</li>
                <li>การจัดการ — สมาชิก · ทรัพย์สิน</li>
                <li>ตั้งค่า — พื้นฐาน · การเงิน · เว็บลูกค้า / Link Hub</li>
              </ul>
            ),
          },
          {
            title: "มือถือ",
            content: "ใช้เมนูล่าง 4 ช่อง · กดซ่อนหัวโมดูลได้ · แท็บหลักจะไปอยู่แถบม่วงเมื่อยุบหัวบนเดสก์ท็อป",
          },
          {
            title: "พอร์ทัลสาธารณะ",
            content: "แชร์ลิงก์ /lms/[slug] จากตั้งค่าเว็บลูกค้า ให้นักเรียนเข้าเรียนผ่านพอร์ทัล",
          },
        ]}
      />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างLMS คอร์สออนไลน์">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {LMS_NAV_ITEMS.map((item) => {
            const active = isLmsModuleNavItemActive(pathname, item.key);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {lmsModuleNavIcon(item.key)}
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

export function LmsModuleChrome({
  children,
  schoolName,
}: {
  children: ReactNode;
  schoolName?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>
      }
    >
      <LmsModuleChromeInner schoolName={schoolName}>{children}</LmsModuleChromeInner>
    </Suspense>
  );
}

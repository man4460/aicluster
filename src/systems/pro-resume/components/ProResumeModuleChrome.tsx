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
  PRO_RESUME_HEADER_COLLAPSE_EVENT,
  PRO_RESUME_MODULE_DISPLAY_NAME,
  PRO_RESUME_NAV_ITEMS,
  isProResumeModuleNavItemActive,
  proResumeModuleNavIcon,
  readProResumeHeaderCollapsed,
  writeProResumeHeaderCollapsed,
} from "@/systems/pro-resume/pro-resume-module-nav";

const shellClass = cn(
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

function ProResumeModuleChromeInner({
  children,
  displayName,
}: {
  children: ReactNode;
  displayName?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readProResumeHeaderCollapsed());
    sync();
    window.addEventListener(PRO_RESUME_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PRO_RESUME_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeProResumeHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header className={cn(shellClass, "flex flex-col px-4 py-4 sm:px-6 sm:py-5", headerCollapsed && "hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-[#5b61ff] text-white shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {PRO_RESUME_MODULE_DISPLAY_NAME}
              </h1>
              {displayName ? (
                <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{displayName}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-9 min-h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0000BF]/25 bg-white text-xs font-semibold text-[#4d47b6] shadow-sm transition hover:bg-slate-50 sm:w-auto sm:gap-2 sm:px-3"
              aria-label="คู่มือการใช้งาน"
            >
              <span className="font-black">?</span>
              <span className="hidden sm:inline">คู่มือ</span>
            </button>
            <button
              type="button"
              onClick={toggleHeaderCollapse}
              className="inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-lg border border-[#0000BF]/25 bg-white text-[#4d47b6] shadow-sm transition hover:bg-slate-50"
              aria-label="ซ่อนส่วนหัวโมดูล"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <nav aria-label="เมนู Pro Resume" className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            {PRO_RESUME_NAV_ITEMS.map((item) => {
              const active = isProResumeModuleNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      {proResumeModuleNavIcon(item.key)}
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
        title="คู่มือ — Pro Resume & Portfolio"
        subtitle="สร้างเรซูmé · แชร์ลิงก์ · ติดตามการเข้าชม"
        sections={[
          {
            title: "เมนูหลัก",
            content: (
              <ul className="list-disc space-y-1 pl-4 text-sm">
                <li>แดชบอร์ด — สถิติการเข้าชมและผลงานยอดนิยม</li>
                <li>โปรไฟล์ — ข้อมูลส่วนตัว การศึกษา ประสบการณ์ ใบรับรอง</li>
                <li>ผลงาน — หมวดและรายการพอร์ตโฟลิโอ</li>
                <li>ตั้งค่า — slug · เปิด/ปิดเว็บ · ลิงก์/QR (แพ็กรายเดือน)</li>
              </ul>
            ),
          },
          {
            title: "แชร์ลิงก์",
            content:
              "แพ็กรายเดือนจึงจะเปิดตัวอย่าง คัดลอกลิงก์ และ QR ได้ — อัปเกรดที่หน้าแพ็กเกจ แล้วเปิดเผยที่ /resume/[slug]",
          },
        ]}
      />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่าง Pro Resume">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {PRO_RESUME_NAV_ITEMS.map((item) => {
            const active = isProResumeModuleNavItemActive(pathname, item.key);
            return (
              <li key={item.key} className="min-w-0">
                <Link href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label} className={appMobileDockLinkClass(active)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {proResumeModuleNavIcon(item.key)}
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

export function ProResumeModuleChrome({
  children,
  displayName,
}: {
  children: ReactNode;
  displayName?: string;
}) {
  return (
    <Suspense fallback={<div className="max-lg:pb-24 lg:pb-0">{children}</div>}>
      <ProResumeModuleChromeInner displayName={displayName}>{children}</ProResumeModuleChromeInner>
    </Suspense>
  );
}

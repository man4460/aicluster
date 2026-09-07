"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { ActivityLogsMobileBottomProvider } from "@/systems/activity-logs/components/ActivityLogsMobileBottomChrome";
import {
  ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT,
  ACTIVITY_LOGS_MODULE_DISPLAY_NAME,
  ACTIVITY_LOGS_NAV_ITEMS,
  isActivityLogsNavItemActive,
  readActivityLogsHeaderCollapsed,
  writeActivityLogsHeaderCollapsed,
  type ActivityLogsNavKey,
} from "@/systems/activity-logs/activity-logs-module-nav";
import {
  activityLogsAccentBarClass,
  activityLogsGlassShellClass,
  activityLogsMainPaddingBottomClass,
  activityLogsNavActiveClass,
  activityLogsNavIdleClass,
} from "@/systems/activity-logs/lib/ui-tokens";

function IconRecent({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function navIcon(key: ActivityLogsNavKey, className?: string) {
  switch (key) {
    case "recent":
      return <IconRecent className={className} />;
    case "filter":
      return <IconFilter className={className} />;
    case "settings":
      return <IconSettings className={className} />;
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
        active ? activityLogsNavActiveClass : activityLogsNavIdleClass,
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
    title: "ลำดับเริ่มต้นแนะนำ",
    content: (
      <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
        <li>เมนู ประวัติล่าสุด — ดูกิจกรรมล่าสุดของผู้ใช้ในระบบ (CREATE / UPDATE / DELETE)</li>
        <li>เมนู ตัวกรอง — เลือกช่วงวันที่ · ตาราง · ประเภทการกระทำ · ส่งออก Excel</li>
        <li>เมนู ตั้งค่า — กำหนดระยะเก็บ log · การแจ้งเตือน (ถ้ามี)</li>
        <li>ใช้ตรวจสอบเมื่อข้อมูลผิดปกติหรือต้อง audit ย้อนหลัง</li>
      </ol>
    ),
  },
  {
    title: "เมนูหลักโมดูล (3 รายการ)",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong>ประวัติล่าสุด</strong> — รายการ log เรียงเวลา · ผู้ใช้ · ตาราง · การกระทำ
        </li>
        <li>
          <strong>ตัวกรอง</strong> — ช่วงวันที่ · modelName · CREATE/UPDATE/DELETE · Export
        </li>
        <li>
          <strong>ตั้งค่า</strong> — การเก็บประวัติ · ตัวเลือกแสดงผล
        </li>
      </ul>
    ),
  },
  {
    title: "เมนู: ประวัติล่าสุด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>บันทึกทุกการกระทำ — เพิ่ม · แก้ไข · ลบข้อมูลในโมดูลต่าง ๆ</li>
        <li>แสดงเวลา (Asia/Bangkok) · อีเมล/ชื่อผู้ใช้ · ชื่อตาราง (modelName)</li>
        <li>การ์ดรายการ — ข้อความสรุปยาว · กริด 1 คอลัมน์เพื่ออ่านง่าย</li>
        <li>คลิกรายการเพื่อดูรายละเอียด before/after (ถ้ามี)</li>
      </ul>
    ),
  },
  {
    title: "เมนู: ตัวกรอง",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>เลือกช่วงวันที่ — ค่าเริ่มต้นเดือนปัจจุบัน · ปรับได้ตามการสอบสวน</li>
        <li>กรองชื่อตาราง — เช่น HomeFinanceEntry · User · โมดูลที่ต้องการ</li>
        <li>กรองประเภท — CREATE / UPDATE / DELETE</li>
        <li>ปุ่ม Excel — ส่งออกรายการที่กำลังแสดงหลังกรอง (SpreadsheetML)</li>
        <li>ปุ่มแสดง/ซ่อนกรอง — ทุก breakpoint · badge เมื่อมีเงื่อนไขค้าง</li>
      </ul>
    ),
  },
  {
    title: "เมนู: ตั้งค่า",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ตัวเลือกการแสดงผลและระยะเก็บ log ตามนโยบายองค์กร</li>
        <li>ใช้ร่วมกับศูนย์แอดมิน — ไม่แทนที่ audit ในโมดูลเฉพาะ (เช่น สารบรรณ)</li>
      </ul>
    ),
  },
];

export function ActivityLogsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readActivityLogsHeaderCollapsed());
    sync();
    window.addEventListener(ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeActivityLogsHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <ActivityLogsMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            activityLogsGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={activityLogsAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {ACTIVITY_LOGS_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
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
                className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
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
            aria-label="เมนูประวัติกรรม"
          >
            <ul className="grid grid-cols-3 gap-2">
              {ACTIVITY_LOGS_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isActivityLogsNavItemActive(pathname, item.key, search)}
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
          title="คู่มือ — ประวัติกรรม"
          sections={guideSections}
        />

        <div className={cn(activityLogsMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </ActivityLogsMobileBottomProvider>
  );
}

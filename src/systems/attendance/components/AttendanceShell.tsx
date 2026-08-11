"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { AttendanceMobileBottomProvider } from "@/systems/attendance/components/AttendanceMobileBottomChrome";
import {
  ATTENDANCE_HEADER_COLLAPSE_EVENT,
  ATTENDANCE_MODULE_DISPLAY_NAME,
  ATTENDANCE_NAV_ITEMS,
  isAttendanceNavItemActive,
  readAttendanceHeaderCollapsed,
  writeAttendanceHeaderCollapsed,
  type AttendanceNavKey,
} from "@/systems/attendance/attendance-module-nav";
import {
  attendanceAccentBarClass,
  attendanceGlassShellClass,
  attendanceMainPaddingBottomClass,
  attendanceModuleIconBadgeClass,
  attendanceNavActiveClass,
  attendanceNavIdleClass,
} from "@/systems/attendance/lib/ui-tokens";
import { AttendanceHeaderBarNav } from "@/systems/attendance/components/AttendanceHeaderBarNav";

type AttendanceNavKeyIcon = AttendanceNavKey;

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconQr({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v7h-3M14 20h3" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: AttendanceNavKeyIcon, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "manage":
      return <IconSettings className={className} />;
    case "reports":
      return <IconReport className={className} />;
    case "qr":
      return <IconQr className={className} />;
  }
}

const manageSubLinks = [
  { href: "/dashboard/attendance/settings", label: "ตั้งค่า" },
  { href: "/dashboard/attendance/roster", label: "รายชื่อพนักงาน" },
  { href: "/dashboard/attendance/check", label: "เช็คอิน" },
] as const;

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
        active ? attendanceNavActiveClass : attendanceNavIdleClass,
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
        <path d="M6 9l6-6 6 6" />
      ) : (
        <path d="M6 15l6 6 6-6" />
      )}
    </svg>
  );
}

const guideSections = [
  {
    title: "ลำดับเริ่มต้นแนะนำ",
    content: (
      <>
        <p>
          ให้ตั้งค่าที่เมนู <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> และ{" "}
          <strong className="font-semibold text-[#2e2a58]">รายชื่อพนักงาน</strong> ก่อน แล้วเผยแพร่{" "}
          <strong className="font-semibold text-[#2e2a58]">QR จุดเช็คอิน</strong> ให้ทีมใช้งาน
        </p>
        <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
          <li>กำหนดกะและนโยบายสาย/ขาด</li>
          <li>เพิ่มพนักงานให้ครบทุกคน</li>
          <li>เปิดใช้ QR และทดสอบเช็คอินจริง</li>
        </ol>
      </>
    ),
  },
  {
    title: "เมนู: แดชบอร์ด",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ดูภาพรวมพนักงานที่เช็คอินแล้ว เช็คเอาท์แล้ว และที่ยังไม่เข้า</li>
        <li>ติดตามสถานะหน้างานแบบเรียลไทม์ในวันปัจจุบัน</li>
        <li>เหมาะสำหรับหัวหน้างานใช้ตรวจความพร้อมทีมก่อนเริ่มกะ</li>
      </ul>
    ),
  },
  {
    title: "เมนู: จัดการเช็คอิน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ตั้งค่า — กำหนดกะเวลางาน เวลาเข้างาน-เลิกงาน และเงื่อนไขการนับสาย</li>
        <li>รายชื่อพนักงาน — เพิ่ม/แก้ไขข้อมูลพนักงานที่สามารถเช็คอินได้</li>
        <li>เช็คอิน — เปิดหน้าจอเช็คอิน/เช็คเอาท์สำหรับเจ้าหน้าที่</li>
      </ul>
    ),
  },
  {
    title: "เมนู: รายงาน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>ดูประวัติการเข้างานย้อนหลังตามช่วงวันที่ต้องการ</li>
        <li>กรองตามพนักงานเพื่อส่งต่อคำนวณเงินเดือน</li>
        <li>ใช้ตรวจเหตุผิดปกติ เช่น ลืมเช็คเอาท์หรือเวลาไม่ครบ</li>
      </ul>
    ),
  },
  {
    title: "เมนู: QR จุดเช็คอิน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>สร้าง QR สำหรับให้พนักงานสแกนเข้า/ออกงาน</li>
        <li>วาง QR ไว้ตำแหน่งที่เข้าถึงง่ายและมีสัญญาณอินเทอร์เน็ต</li>
        <li>ทดสอบสแกนจากมือถือหลายเครื่องก่อนเริ่มใช้งานจริง</li>
      </ul>
    ),
  },
];

export function AttendanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readAttendanceHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readAttendanceHeaderCollapsed());
    sync();
    window.addEventListener(ATTENDANCE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ATTENDANCE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeAttendanceHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  const inManageGroup = isAttendanceNavItemActive(pathname, "manage");

  return (
    <AttendanceMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        {headerCollapsed ? (
          <div className="sticky top-0 z-40 print:hidden">
            <div className={cn("mx-auto flex max-w-full items-center gap-2 rounded-2xl px-2 py-2 sm:rounded-3xl sm:px-3 sm:py-2.5", appDashboardBrandGradientFillClass)}>
              <AttendanceHeaderBarNav onExpand={toggleHeaderCollapse} />
            </div>
          </div>
        ) : null}
        <header
          className={cn(
            attendanceGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={attendanceAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div className={attendanceModuleIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {ATTENDANCE_MODULE_DISPLAY_NAME}
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
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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
            aria-label="เมนูเช็คอินอัจฉริยะ"
          >
            <ul className="grid grid-cols-4 gap-2">
              {ATTENDANCE_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isAttendanceNavItemActive(pathname, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {inManageGroup ? (
          <nav
            aria-label="เมนูย่อยจัดการเช็คอิน"
            className="overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.25),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-4"
          >
            <ul className="grid grid-cols-3 gap-2">
              {manageSubLinks.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-[42px] items-center justify-center rounded-xl px-3 text-xs font-bold transition sm:text-sm",
                        active
                          ? attendanceNavActiveClass
                          : attendanceNavIdleClass,
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือ — เช็คอินอัจฉริยะ"
          subtitle="เช็คอิน–เช็คเอาท์ กะงาน รายงาน และ QR จุดเช็คอิน"
          sections={guideSections}
        />

        <div className={cn(attendanceMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </AttendanceMobileBottomProvider>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  EDUCARE_HEADER_COLLAPSE_EVENT,
  EDUCARE_MODULE_DISPLAY_NAME,
  EDUCARE_NAV_ITEMS,
  educarePathFlags,
  isEducareNavItemActive,
  readEducareHeaderCollapsed,
  writeEducareHeaderCollapsed,
  type EducareNavKey,
} from "@/systems/educare/educare-module-nav";
import { EducareMobileBottomProvider } from "@/systems/educare/components/EducareMobileBottomChrome";
import { EducareButton } from "@/systems/educare/components/EducareButton";
import {
  educareFilterChipClass,
  educareSegmentShellClass,
} from "@/systems/educare/educare-ui-tokens";
import {
  educareAccentBarClass,
  educareGlassShellClass,
  educareMainPaddingBottomClass,
  educareModuleIconBadgeClass,
  educareNavActiveClass,
  educareNavIdleClass,
} from "@/systems/educare/lib/ui-tokens";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M9 11l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function navIcon(key: EducareNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "check":
      return <IconCheck className={className} />;
    case "classrooms":
      return <IconStack className={className} />;
    case "reports":
      return <IconReport className={className} />;
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
        "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] w-full sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2",
        active ? educareNavActiveClass : educareNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

const manageSubLinks = [
  { href: "/dashboard/educare/students", label: "นักเรียน" },
  { href: "/dashboard/educare/classrooms", label: "ห้องเรียน" },
  { href: "/dashboard/educare/settings", label: "ตั้งค่า" },
] as const;

function EducareShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const flags = educarePathFlags(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readEducareHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readEducareHeaderCollapsed());
    sync();
    window.addEventListener(EDUCARE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EDUCARE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeEducareHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  const inManageGroup = flags.isClassrooms;

  return (
    <div className={cn("max-w-full space-y-4 sm:space-y-6", educareMainPaddingBottomClass)}>
      <header
        className={cn(
          educareGlassShellClass,
          "flex shrink-0 flex-col print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className={educareAccentBarClass} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                educareModuleIconBadgeClass,
                "flex items-center justify-center shadow-lg shadow-fuchsia-500/20",
                appDashboardBrandGradientFillClass,
              )}
            >
              <IconCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                {EDUCARE_MODULE_DISPLAY_NAME}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <EducareButton
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-1.5 sm:px-4 sm:inline-flex"
              aria-label="คู่มือการใช้งาน"
              aria-haspopup="dialog"
              aria-expanded={usageGuideOpen}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </EducareButton>
            <EducareButton
              type="button"
              onClick={toggleHeaderCollapse}
              className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
            >
              <HeaderCollapseGlyph collapsed={headerCollapsed} />
            </EducareButton>
          </div>
        </div>
        <nav aria-label="เมนู EduCare" className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden">
          <ul className="grid grid-cols-4 gap-2">
            {EDUCARE_NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <TabLink
                  href={item.href}
                  label={item.label}
                  active={isEducareNavItemActive(pathname, item.key)}
                  icon={navIcon(item.key, "h-4 w-4")}
                />
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {inManageGroup ? (
        <nav aria-label="เมนูย่อยจัดการห้องเรียน" className={educareSegmentShellClass}>
          <ul className="grid grid-cols-3 gap-1.5">
            {manageSubLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("flex w-full items-center justify-center", educareFilterChipClass(active))}
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
        title="คู่มือการใช้งาน — EduCare เช็คนักเรียน"
        subtitle="ภาพรวมการตั้งค่าและการเช็ค 6 ฟีเจอร์ ให้ใช้งานได้เร็วในวันแรก"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ตั้งค่าโรงเรียนและเวลาเช็ค → เพิ่มห้องเรียน → เพิ่มนักเรียน →
                  เปิดเมนู <strong className="font-semibold text-[#2e2a58]">เช็คประจำวัน</strong>{" "}
                  เพื่อเริ่มเช็ค 6 ฟีเจอร์ในแต่ละวัน
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งค่าโรงเรียน + เวลาเช็คแต่ละช่วง</li>
                  <li>เพิ่มห้องเรียนพร้อมครูประจำชั้น</li>
                  <li>เพิ่มนักเรียนเข้าห้องที่ต้องการ</li>
                  <li>กดเช็คประจำวันเริ่มจากเช็คเข้าแถวก่อนเสมอ</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ภาพรวมจำนวนนักเรียนวันนี้: มา ขาด ลา สาย</li>
                <li>เปอร์เซ็นต์ความเรียบร้อยและกิจกรรม (อาหาร นม แปรงฟัน)</li>
                <li>กราฟ 7 วันย้อนหลัง + นักเรียนที่ขาดบ่อย / มาเรียนสม่ำเสมอ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: เช็คประจำวัน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เลือกห้องเรียน → เลือกฟีเจอร์ที่จะเช็ค (เข้าแถว → เรียบร้อย → ดื่มนม ฯลฯ)</li>
                <li>เช็คทีละคน หรือกด "ทุกคนมา" / "ทุกคนผ่าน" เพื่อความเร็ว</li>
                <li>เช็คเข้าแถวเป็นจุดเริ่ม — นักเรียนที่ขาดจะไม่ต้องเช็คฟีเจอร์อื่นซ้ำ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: จัดการห้องเรียน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>นักเรียน — เพิ่ม/แก้ไข/ปิดการใช้งาน + รูปและข้อมูลผู้ปกครอง</li>
                <li>ห้องเรียน — กำหนดชื่อห้อง ระดับชั้น ครูประจำชั้น</li>
                <li>ตั้งค่า — ชื่อโรงเรียน เวลาเช็คมาตรฐาน เปิด/ปิด การแจ้งเตือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สรุปรายเดือน/รายห้องเรียน/รายบุคคล</li>
                <li>กรองช่วงวันที่และส่งออกเป็น CSV หรือพิมพ์ PDF</li>
                <li>ใช้ตรวจประวัติเพื่อรายงานต่อผู้บริหารและผู้ปกครอง</li>
              </ul>
            ),
          },
        ]}
      />

      <main className={cn(appModuleShellMainScrollClass, "min-h-0 w-full flex-1")}>
        {children}
      </main>
    </div>
  );
}

export function EducareShell({ children }: { children: React.ReactNode }) {
  return (
    <EducareMobileBottomProvider>
      <EducareShellInner>{children}</EducareShellInner>
    </EducareMobileBottomProvider>
  );
}

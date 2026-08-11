"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { AppointmentQueueMobileBottomProvider } from "@/systems/appointment-queue/components/AppointmentQueueMobileBottomChrome";
import {
  APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT,
  APPOINTMENT_QUEUE_MODULE_DISPLAY_NAME,
  APPOINTMENT_QUEUE_NAV_ITEMS,
  isAppointmentQueueNavItemActive,
  readAppointmentQueueHeaderCollapsed,
  writeAppointmentQueueHeaderCollapsed,
  type AppointmentQueueNavKey,
} from "@/systems/appointment-queue/appointment-queue-module-nav";
import {
  aqIconBadgeClass,
  aqModuleHeaderShellClass,
  aqNavItemActiveClass,
  aqNavItemBase,
  aqNavItemIdleClass,
} from "@/systems/appointment-queue/appointment-queue-ui-tokens";
import { appDashboardBrandGradientBarClass } from "@/components/app-templates/dashboard-tokens";

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconBoard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="6" height="16" rx="1.5" />
      <rect x="9" y="4" width="6" height="16" rx="1.5" />
      <rect x="15" y="4" width="6" height="16" rx="1.5" />
    </svg>
  );
}
function IconService({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3v18M8 7h8M7 12h10M8 17h8" strokeLinecap="round" />
    </svg>
  );
}
function IconStaff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: AppointmentQueueNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconBoard className={className} />;
    case "schedule":
      return <IconCalendar className={className} />;
    case "services":
      return <IconService className={className} />;
    case "staff":
      return <IconStaff className={className} />;
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
        aqNavItemBase,
        "w-full",
        active ? aqNavItemActiveClass : aqNavItemIdleClass,
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

export function AppointmentQueueShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readAppointmentQueueHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readAppointmentQueueHeaderCollapsed());
    sync();
    window.addEventListener(APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeAppointmentQueueHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <AppointmentQueueMobileBottomProvider>
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 lg:pb-0">
      <header
        className={cn(
          aqModuleHeaderShellClass,
          "flex shrink-0 flex-col print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                aqIconBadgeClass,
                "shadow-lg shadow-fuchsia-500/20",
                appDashboardBrandGradientFillClass,
              )}
            >
              <IconCalendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                {APPOINTMENT_QUEUE_MODULE_DISPLAY_NAME}
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
        <nav aria-label="เมนูจองคิว" className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {APPOINTMENT_QUEUE_NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <TabLink
                  href={item.href}
                  label={item.label}
                  active={isAppointmentQueueNavItemActive(pathname, item.key)}
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
        title="คู่มือจองคิวอัจฉริยะ"
        subtitle="คิว ตาราง บริการ ช่าง และตั้งค่า"
        sections={[
          {
            title: "เมนูหลัก",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>แท็บเมนูอยู่ในส่วนหัว — กดซ่อนเพื่อย้ายไปแถบบน (คอมพิวเตอร์) หรือเหลือเมนูล่าง (มือถือ)</li>
                <li>มือถือใช้ dock ด้านล่างสลับหน้าตามแพทเทิร์นโรงแรม / POS</li>
              </ul>
            ),
          },
          {
            title: "คิว (ภาพรวม)",
            content: <p>บอร์ดคิวลากสลับสถานะ · ดูภาพรวมการจองวันนี้</p>,
          },
          {
            title: "ตารางเวลา",
            content: <p>จัดตารางเวลาเปิดร้านและช่องว่างสำหรับลูกค้าจอง</p>,
          },
          {
            title: "บริการ / ช่าง",
            content: <p>เพิ่มรายการบริการและกำหนดช่างผู้ให้บริการแต่ละคน</p>,
          },
          {
            title: "ตั้งค่า / ลิงก์",
            content: <p>ตั้งค่าร้าน · แชร์ QR พอร์ทัลลูกค้าสแกนจองคิวเอง</p>,
          },
        ]}
      />
      {children}
    </div>
    </AppointmentQueueMobileBottomProvider>
  );
}

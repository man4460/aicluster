"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
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
  appointmentQueueAccentBarClass,
  appointmentQueueGlassShellClass,
  appointmentQueueMainPaddingBottomClass,
  appointmentQueueNavActiveClass,
  appointmentQueueNavIdleClass,
} from "@/systems/appointment-queue/lib/ui-tokens";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function IconBoard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="3" y="4" width="6" height="16" rx="1.5" />
      <rect x="9" y="4" width="6" height="16" rx="1.5" />
      <rect x="15" y="4" width="6" height="16" rx="1.5" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 2v3M16 2v3M3 9h18" strokeLinecap="round" />
    </svg>
  );
}

function IconService({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M12 3v18M8 7h8M7 12h10M8 17h8" strokeLinecap="round" />
    </svg>
  );
}

function IconStaff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
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
        active ? appointmentQueueNavActiveClass : appointmentQueueNavIdleClass,
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
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function AppointmentQueueModuleShell({ children }: { children: React.ReactNode }) {
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
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            appointmentQueueGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={appointmentQueueAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <IconBoard className="h-5 w-5" />
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

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลจองคิวอัจฉริยะ"
          >
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {APPOINTMENT_QUEUE_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label}
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
              title: "ลำดับเริ่มต้นแนะนำ (ร้านใหม่)",
              content: (
                <>
                  <p>
                    ตั้งค่าร้านและบริการก่อน → กำหนดช่างและตาราง → เปิดรับคิวที่{" "}
                    <strong className="font-semibold text-[#2e2a58]">คิว</strong> → แชร์ QR จาก{" "}
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong>
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                    <li>เมนู ตั้งค่า — ชื่อร้าน · เวลาเปิด · ลิงก์/QR พอร์ทัลลูกค้า</li>
                    <li>เมนู บริการ — เพิ่มรายการบริการ · ราคา · ระยะเวลา</li>
                    <li>เมนู ช่าง — เพิ่มช่าง · ผูกบริการที่ทำได้</li>
                    <li>เมนู ตาราง — กำหนดช่องว่างและเวลาเปิดรับจอง</li>
                    <li>เมนู คิว — รับจองวันนี้ · ลากสลับสถานะ · เรียกคิว</li>
                  </ol>
                </>
              ),
            },
            {
              title: "เมนูหลักโมดูล (5 รายการ)",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong>คิว</strong> — บอร์ดคิววันนี้ · ลากสลับสถานะ · ภาพรวมการจอง
                  </li>
                  <li>
                    <strong>ตาราง</strong> — เวลาเปิดร้าน · ช่องว่าง · วันลา/ปิด
                  </li>
                  <li>
                    <strong>บริการ</strong> — รายการบริการ · ราคา · ระยะเวลา
                  </li>
                  <li>
                    <strong>ช่าง</strong> — รายชื่อช่าง · ผูกบริการ · ตารางงาน
                  </li>
                  <li>
                    <strong>ตั้งค่า</strong> — ข้อมูลร้าน · QR พอร์ทัล · การแจ้งเตือน
                  </li>
                </ul>
              ),
            },
            {
              title: "เมนู: คิว",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>บอร์ดคิววันนี้ — รอ · กำลังให้บริการ · เสร็จ · ยกเลิก</li>
                  <li>ลากการ์ดสลับสถานะ — อัปเดตแบบเรียลไทม์ (SSE)</li>
                  <li>รับจองจากพอร์ทัลลูกค้า — แสดงชื่อ · บริการ · ช่าง · เวลา</li>
                  <li>เรียกคิวถัดไป — เหมาะหน้างานมือถือ/แท็บเล็ต</li>
                  <li>กรองตามช่างหรือบริการเมื่อร้านมีหลายสาย</li>
                </ul>
              ),
            },
            {
              title: "เมนู: ตาราง",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>กำหนดเวลาเปิด–ปิดรายวัน — ใช้เวลาไทย 24 ชม.</li>
                  <li>ช่องว่างต่อสล็อต — ความยาวตามบริการ · กัน double-book</li>
                  <li>วันปิดหรือลาพัก — บล็อกไม่ให้ลูกค้าจอง</li>
                  <li>ซิงก์กับพอร์ทัล — ลูกค้าเห็นเฉพาะช่องว่างจริง</li>
                </ul>
              ),
            },
            {
              title: "เมนู: บริการ",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เพิ่มบริการ — ชื่อ · คำอธิบาย · ราคา · ระยะเวลา (นาที)</li>
                  <li>เปิด/ปิดบริการ — ที่ปิดจะไม่โผล่ในพอร์ทัล</li>
                  <li>เรียงลำดับแสดง — บริการยอดนิยมไว้บน</li>
                </ul>
              ),
            },
            {
              title: "เมนู: ช่าง",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เพิ่มช่าง — ชื่อ · รูป · เบอร์ติดต่อ</li>
                  <li>ผูกบริการที่ทำได้ — ลูกค้าเลือกช่าง+บริการตอนจอง</li>
                  <li>ปิดใช้งานช่างลา — ไม่รับจองในช่องของช่างนั้น</li>
                </ul>
              ),
            },
            {
              title: "เมนู: ตั้งค่า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ข้อมูลร้าน — ชื่อ · ที่อยู่ · เบอร์ · โลโก้</li>
                  <li>QR/ลิงก์พอร์ทัลลูกค้า — คัดลอก · ดาวน์โหลดโปสเตอร์ · แชร์ LINE</li>
                  <li>ลูกค้าจองเอง — เลือกบริการ · ช่าง · วันเวลา (เวลาไทย)</li>
                  <li>การแจ้งเตือนและตัวเลือกอื่นตามแพ็กเกจ</li>
                </ul>
              ),
            },
          ]}
        />

        <div className={cn(appointmentQueueMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </AppointmentQueueMobileBottomProvider>
  );
}

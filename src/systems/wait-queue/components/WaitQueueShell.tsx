"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { WaitQueueMobileBottomProvider } from "@/systems/wait-queue/components/WaitQueueMobileBottomChrome";
import {
  WAIT_QUEUE_HEADER_COLLAPSE_EVENT,
  WAIT_QUEUE_MODULE_DISPLAY_NAME,
  WAIT_QUEUE_NAV_ITEMS,
  isWaitQueueNavItemActive,
  readWaitQueueHeaderCollapsed,
  writeWaitQueueHeaderCollapsed,
  type WaitQueueNavKey,
} from "@/systems/wait-queue/wait-queue-module-nav";
import {
  waitQueueAccentBarClass,
  waitQueueGlassShellClass,
  waitQueueMainPaddingBottomClass,
  waitQueueNavActiveClass,
  waitQueueNavIdleClass,
} from "@/systems/wait-queue/lib/ui-tokens";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function IconQueue({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: WaitQueueNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconQueue className={className} />;
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
        active ? waitQueueNavActiveClass : waitQueueNavIdleClass,
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
    title: "ลำดับเริ่มต้นแนะนำ (ร้านใหม่)",
    content: (
      <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อร้าน · ข้อความประกาศเมื่อเรียกคิว (เช่น «เชิญเข้าร้าน»)
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ทดลองลงคิว</strong> — กรอกจำนวนคน · ชื่อเรียก (ถ้ามี) · กดบันทึก
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">เรียกคิว</strong> — กด «เรียกถัดไป» หรือเรียกจากแถว · เปิดเสียงประกาศ (ถ้าต้องการ)
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ปิดคิว</strong> — ยืนยันเข้าร้านหรือข้ามเมื่อลูกค้าไม่มา
        </li>
      </ol>
    ),
  },
  {
    title: "เมนูหลัก (2 รายการ)",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">คิววันนี้</strong> — ลงคิว · เรียก · อัปเดตสถานะ · แถบประกาศด้านบน
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อร้าน · ข้อความเรียกคิว · บันทึก
        </li>
        <li>
          มือถือใช้ <strong className="font-semibold text-[#2e2a58]">dock ล่าง</strong> 2 ปุ่ม · เดสก์ท็อปใช้แท็บในการ์ดหัว
        </li>
        <li>
          ปุ่ม <strong className="font-semibold text-[#2e2a58]">ซ่อนส่วนหัว</strong> ยุบการ์ดชื่อโมดูล — เมนูยังใช้ dock/แถบม่วงได้
        </li>
      </ul>
    ),
  },
  {
    title: "คิววันนี้ — ลงคิว · เรียก · ประกาศ",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          ลงคิว walk-in — ระบุ <strong className="font-semibold text-[#2e2a58]">จำนวนคน</strong> · ชื่อเรียก/หมายเหตุ (ถ้ามี) · ได้เลขคิวอัตโนมัติ
        </li>
        <li>
          แถบด้านบน — แสดงเลขคิวที่ <strong className="font-semibold text-[#2e2a58]">ถึงคิว</strong> และข้อความเชิญจากตั้งค่า
        </li>
        <li>
          ปุ่ม <strong className="font-semibold text-[#2e2a58]">เรียกถัดไป</strong> — เรียกคิวรอที่เก่าที่สุด · หรือกดเรียกจากแถวรายการโดยตรง
        </li>
        <li>
          สวิตช์ <strong className="font-semibold text-[#2e2a58]">เสียงประกาศ</strong> — อ่านเลขคิวด้วยเสียง (ต้องแตะเปิดเสียงครั้งแรกบนมือถือ)
        </li>
        <li>ปุ่มรีเฟรช — โหลดคิวล่าสุดเมื่อมีหลายเครื่องพนักงาน</li>
      </ul>
    ),
  },
  {
    title: "สถานะคิว — ขั้นตอนการทำงาน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">กำลังรอ</strong> — ลูกค้ารอเรียก · กดเรียกแล้วเปลี่ยนเป็น «เรียกแล้ว»
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">เรียกแล้ว</strong> — ประกาศแล้ว · รอยืนยันว่าเข้าร้าน
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">เข้าร้านแล้ว</strong> — ปิดคิวสำเร็จ · หรือกดข้าม/ยกเลิกถ้าลูกค้าไม่มา
        </li>
        <li>คิววันนี้รีเซ็ตอัตโนมัติตามวันปฏิทินไทย (Asia/Bangkok)</li>
      </ul>
    ),
  },
  {
    title: "ตั้งค่า",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">ชื่อร้าน</strong> — แสดงบนหัวหน้าคิว (ถ้ามี)
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ข้อความเรียกคิว</strong> — ต่อท้ายเลขคิวตอนประกาศ เช่น «เชิญเข้าร้าน»
        </li>
        <li>กดบันทึก — ใช้กับคิวใหม่ทันที · แจ้งสำเร็จผ่าน popup กลางจอ</li>
      </ul>
    ),
  },
];

export function WaitQueueShell({
  children,
}: {
  siteName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readWaitQueueHeaderCollapsed());
    sync();
    window.addEventListener(WAIT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WAIT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeWaitQueueHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <WaitQueueMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            waitQueueGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={waitQueueAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {WAIT_QUEUE_MODULE_DISPLAY_NAME}
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
            aria-label="เมนูโมดูลคิวหน้าร้าน"
          >
            <ul className="grid grid-cols-2 gap-2">
              {WAIT_QUEUE_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label}
                    active={isWaitQueueNavItemActive(pathname, item.key)}
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
          title="คู่มือ — คิวหน้าร้าน"
          subtitle="ลงคิว · เรียก · ประกาศเสียง · ตั้งค่า"
          sections={guideSections}
        />

        <div className={cn(waitQueueMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </WaitQueueMobileBottomProvider>
  );
}

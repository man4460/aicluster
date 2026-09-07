"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { HomeFinanceMobileBottomProvider } from "@/systems/home-finance/components/HomeFinanceMobileBottomChrome";
import {
  HOME_FINANCE_HEADER_COLLAPSE_EVENT,
  HOME_FINANCE_MODULE_DISPLAY_NAME,
  HOME_FINANCE_NAV_ITEMS,
  isHomeFinanceNavItemActive,
  readHomeFinanceHeaderCollapsed,
  writeHomeFinanceHeaderCollapsed,
  type HomeFinanceNavKey,
} from "@/systems/home-finance/home-finance-module-nav";
import {
  homeFinanceAccentBarClass,
  homeFinanceGlassShellClass,
  homeFinanceMainPaddingBottomClass,
  homeFinanceNavActiveClass,
  homeFinanceNavIdleClass,
} from "@/systems/home-finance/lib/ui-tokens";

function IconOverview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconEntries({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDocuments({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 13h6M10 17h4" strokeLinecap="round" />
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

function navIcon(key: HomeFinanceNavKey, className?: string) {
  switch (key) {
    case "overview":
      return <IconOverview className={className} />;
    case "entries":
      return <IconEntries className={className} />;
    case "documents":
      return <IconDocuments className={className} />;
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
        active ? homeFinanceNavActiveClass : homeFinanceNavIdleClass,
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
        <li>เมนู <strong>ตั้งค่า</strong> — สร้างหมวดรายรับและรายจ่าย (เช่น เงินเดือน · ค่าอาหาร · รายได้เสริม)</li>
        <li>เมนู <strong>ภาพรวม</strong> — บันทึกรายการแรก · เลือกประเภท · หมวด · จำนวนเงิน · แนบสลิป</li>
        <li>เมนู <strong>บันทึก</strong> — ตรวจย้อนหลัง · แก้ไข/ลบ · กรองช่วงวันที่</li>
        <li>เมนู <strong>เอกสารหลักฐาน</strong> — เก็บบัตรประชาชน · สัญญา · ใบรับรอง แยกจากสลิปรายวัน</li>
        <li>ทบทวนยอดสุทธิทุกสิ้นเดือนจากกราฟและการ์ดสรุปบนภาพรวม</li>
      </ol>
    ),
  },
  {
    title: "เมนูหลักโมดูล (4 รายการ)",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong>ภาพรวม</strong> — สรุปรายรับ/รายจ่าย/คงเหลือ · ฟอร์มบันทึกเร็ว · กราฟรายเดือน
        </li>
        <li>
          <strong>บันทึก</strong> — ประวัติรายการทั้งหมด · กรอง · แก้ไข · ลบ · ดูสลิป
        </li>
        <li>
          <strong>เอกสารหลักฐาน</strong> — เก็บเอกสารสำคัญ · รูป/PDF · หมวดย่อย
        </li>
        <li>
          <strong>ตั้งค่า</strong> — จัดการหมวดรายรับ–รายจ่าย · งบประมาณ (ถ้ามี)
        </li>
      </ul>
    ),
  },
  {
    title: "เมนู: ภาพรวม",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>การ์ดสรุป — รายรับ · รายจ่าย · คงเหลือสุทธิ (สีเขียว/ชมพู · กริด 2 คอลัมน์บนมือถือ)</li>
        <li>ฟอร์มบันทึก — เลือกรายรับหรือรายจ่าย · หมวด · ชื่อรายการ · จำนวนเงิน · วันที่ · หมายเหตุ</li>
        <li>แนบสลิป — เลือกรูปหรือถ่ายกล้อง · ย่อก่อนอัปโหลด · ดูขยายเต็มจอจากรายการ</li>
        <li>กราฟรายเดือน — แนวโน้มรายรับ–รายจ่าย · ใช้โหมด compact จาก template กลาง</li>
        <li>ไม่ผูกบิลร้านหรือรถ — เหมาะบันทึกครัวเรือนหรือธุรกิจเล็กแบบง่าย</li>
      </ul>
    ),
  },
  {
    title: "เมนู: บันทึก",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>รายการทั้งหมดเรียงตามวันที่ — รายรับสีเขียว · รายจ่ายสีชมพู</li>
        <li>กรอง — ช่วงวันที่ · ประเภท · หมวด · คำค้น · ปุ่มแสดง/ซ่อนกรอง</li>
        <li>แก้ไข — เปิดฟอร์ม · เปลี่ยนหมวด/ยอด/วันที่ · อัปเดตหรือลบสลิป</li>
        <li>ลบ — ยืนยันผ่าน popup กลางจอก่อนลบถาวร</li>
        <li>สลิป — แสดงรูปย่อเฉพาะเมื่อมี URL · ไม่มี placeholder ว่าง</li>
      </ul>
    ),
  },
  {
    title: "เมนู: เอกสารหลักฐาน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>เก็บเอกสารระยะยาว — บัตรประชาชน · สัญญา · ใบรับรอง · ใบเสร็จสำคัญ</li>
        <li>อัปโหลดรูปหรือ PDF — ตั้งชื่อและหมวดย่อยให้ค้นหาง่าย</li>
        <li>แยกจากสลิปในรายการรายวัน — ไม่ปนกับบันทึกรายรับ–รายจ่าย</li>
        <li>ดูเอกสารเต็มจอจากรายการ · ลบ/แก้ไขชื่อเมื่อหมดอายุหรือเปลี่ยนฉบับ</li>
      </ul>
    ),
  },
  {
    title: "เมนู: ตั้งค่า",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>หมวดรายรับ — เช่น เงินเดือน · ดอกเบี้ย · รายได้เสริม</li>
        <li>หมวดรายจ่าย — เช่น ค่าอาหาร · ค่าเช่า · สาธารณูปโภค · ผ่อน</li>
        <li>เรียงลำดับหมวด · ปิดหมวดที่ไม่ใช้แล้วแทนลบถ้ามีประวัติ</li>
        <li>ตั้งงบประมาณรายเดือนต่อหมวด (ถ้าเปิดใช้) — ดู progress บนภาพรวม</li>
      </ul>
    ),
  },
];

export function HomeFinanceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readHomeFinanceHeaderCollapsed());
    sync();
    window.addEventListener(HOME_FINANCE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOME_FINANCE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeHomeFinanceHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <HomeFinanceMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            homeFinanceGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={homeFinanceAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.35" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {HOME_FINANCE_MODULE_DISPLAY_NAME}
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
            aria-label="เมนูระบบรายรับรายจ่าย"
          >
            <ul className="grid grid-cols-4 gap-2">
              {HOME_FINANCE_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isHomeFinanceNavItemActive(pathname, item.key)}
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
          title="คู่มือ — รายรับ–รายจ่าย"
          sections={guideSections}
        />

        <div className={cn(homeFinanceMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </HomeFinanceMobileBottomProvider>
  );
}

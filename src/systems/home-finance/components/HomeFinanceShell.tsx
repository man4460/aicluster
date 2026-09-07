"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AppMobileDockShell,
  AppUsageGuideModal,
  appMobileDockGridClass,
  appMobileDockLinkClass,
  appModuleShellMainScrollClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HomeFinanceMobileBottomProvider } from "@/systems/home-finance/components/HomeFinanceMobileBottomChrome";
import {
  HOME_FINANCE_HEADER_COLLAPSE_EVENT,
  HOME_FINANCE_MODULE_DISPLAY_NAME,
  HOME_FINANCE_NAV_ITEMS,
  isHomeFinanceModulePath,
  isHomeFinanceNavItemActive,
  readHomeFinanceHeaderCollapsed,
  writeHomeFinanceHeaderCollapsed,
  type HomeFinanceNavKey,
} from "@/systems/home-finance/home-finance-module-nav";
import {
  homeFinanceDesktopNavLinkClass,
  homeFinanceIconButtonClass,
  homeFinanceMainPaddingBottomClass,
  homeFinanceModuleShellClass,
  homeFinanceOutlineButtonClass,
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

function HeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

const guideSections = [
  {
    title: "ลำดับเริ่มต้นแนะนำ",
    content: (
      <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
        <li>
          เมนู <strong>ตั้งค่า</strong> — สร้างหมวดรายรับและรายจ่ายให้ครบก่อนบันทึกรายการ
        </li>
        <li>
          เมนู <strong>ภาพรวม</strong> — ดูสรุปเดือนนี้ · บันทึกรายการแรก · แนบสลิปได้
        </li>
        <li>
          เมนู <strong>บันทึก</strong> — กรองช่วงเวลา · ค้นหา · แก้ไข/ลบ · กดดูสลิปเต็มจอ
        </li>
        <li>
          เมนู <strong>เอกสารหลักฐาน</strong> — เก็บรูป/PDF เอกสารสำคัญแยกจากสลิปรายวัน
        </li>
        <li>
          เมนูย่อยใต้ <strong>ภาพรวม</strong> — ใช้แท็บ <strong>รหัสผ่าน</strong> และ <strong>โน้ต</strong> สำหรับของส่วนตัวคู่กับการเงิน
        </li>
      </ol>
    ),
  },
  {
    title: "เมนูหลักโมดูล (4 รายการ)",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong>ภาพรวม</strong> — สรุปรายรับ–รายจ่าย · กราฟ · และเมนูย่อย รหัสผ่าน / โน้ต
        </li>
        <li>
          <strong>บันทึก</strong> — ประวัติรายการทั้งหมด · กรอง · แก้ไข · ลบ
        </li>
        <li>
          <strong>เอกสารหลักฐาน</strong> — อัปโหลดและจัดเก็บเอกสารสำคัญ
        </li>
        <li>
          <strong>ตั้งค่า</strong> — จัดการหมวดรายรับ / รายจ่าย
        </li>
        <li>
          มือถือใช้ <strong>dock ล่าง</strong> · เดสก์ท็อปใช้แท็บในหัวโมดูล · กด <strong>ซ่อนส่วนหัว</strong> ได้ (จำค่าในเครื่อง)
        </li>
      </ul>
    ),
  },
  {
    title: "เมนูย่อยใต้ภาพรวม — สิ่งที่เพิ่มใหม่",
    content: (
      <ul className="list-disc space-y-2 pl-5 marker:text-[#4d47b6]">
        <li>
          ใต้เมนูหลัก <strong>ภาพรวม</strong> มีแถบย่อย 3 แท็บ: <strong>ภาพรวม</strong> · <strong>รหัสผ่าน</strong> ·{" "}
          <strong>โน้ต</strong>
        </li>
        <li>
          สลับแท็บได้จากแถบย่อยบนหน้า (มือถือและเดสก์ท็อป) — ไม่ต้องออกจากโมดูลบันทึกส่วนตัว
        </li>
        <li>
          ข้อมูลอยู่ภายใต้บัญชีคุณ — แยกจากสลิป/รายการเงินในแท็บภาพรวมและบันทึก
        </li>
      </ul>
    ),
  },
  {
    title: "รหัสผ่าน (ใหม่) — วิธีใช้",
    content: (
      <ul className="list-disc space-y-2 pl-5 marker:text-[#4d47b6]">
        <li>
          เข้าทาง <strong>ภาพรวม → รหัสผ่าน</strong> (หรือเปิดตรง <code className="rounded bg-[#f3f2fa] px-1 text-[12px]">/dashboard/home-finance/passwords</code>)
        </li>
        <li>
          กด <strong>เพิ่ม</strong> แล้วกรอก <strong>ชื่อบริการ</strong> · <strong>ชื่อผู้ใช้</strong> ·{" "}
          <strong>รหัสผ่าน</strong> — บันทึกแล้วรหัสจะถูกเก็บเข้ารหัสในคลังรหัสของบัญชี
        </li>
        <li>
          ในรายการ: กดไอคอน <strong>ตา</strong> เพื่อแสดง/ซ่อนรหัส · ไอคอน <strong>คัดลอก</strong> เพื่อคัดลอกรหัสไปคลิปบอร์ด
        </li>
        <li>
          กดไอคอน <strong>แก้ไข</strong> เพื่อเปลี่ยนชื่อบริการ/ผู้ใช้ — ถ้าต้องการเปลี่ยนรหัส ให้กรอกรหัสใหม่ในฟอร์ม (เว้นว่าง = คงรหัสเดิม)
        </li>
        <li>
          กดไอคอน <strong>ลบ</strong> แล้วยืนยันเพื่อลบรายการนั้นออกจากคลัง
        </li>
        <li>
          ใช้ช่อง <strong>ค้นหา</strong> กรองตามชื่อบริการ / ผู้ใช้ / เว็บไซต์ได้ทันที
        </li>
        <li>
          เหมาะเก็บบัญชีธนาคาร · อีเมล · แอปที่ใช้คู่กับการเงินบ้าน — ไม่ใช่แทนระบบคลังรหัสผ่านหลักทั้งแพลตฟอร์มถ้ามีโมดูลแยก
        </li>
      </ul>
    ),
  },
  {
    title: "โน้ต (ใหม่) — วิธีใช้",
    content: (
      <ul className="list-disc space-y-2 pl-5 marker:text-[#4d47b6]">
        <li>
          เข้าทาง <strong>ภาพรวม → โน้ต</strong> (หรือ{" "}
          <code className="rounded bg-[#f3f2fa] px-1 text-[12px]">/dashboard/home-finance/notes</code>)
        </li>
        <li>
          พิมพ์ข้อความในช่องด้านบน แล้วกด <strong>บันทึก</strong> เพื่อสร้างโน้ตใหม่ — แสดงวันเวลาตามโซนไทย
        </li>
        <li>
          กดไอคอน <strong>แก้ไข</strong> บนการ์ดเพื่อแก้ข้อความ · ยืนยันด้วยปุ่มติ๊ก · ยกเลิกด้วยปุ่มกากบาท
        </li>
        <li>
          กดไอคอน <strong>ลบ</strong> เพื่อลบโน้ตนั้น
        </li>
        <li>
          เปิด/ปิด <strong>ตัวกรอง</strong> แล้วพิมพ์คำค้นเพื่อหาโน้ตที่มีข้อความตรงกัน
        </li>
        <li>
          ปุ่ม <strong>รีเฟรช</strong> โหลดรายการล่าสุดจากเซิร์ฟเวอร์อีกครั้ง
        </li>
        <li>
          ใช้จดเตือนสั้น ๆ คู่การเงิน เช่น งวดบิล · สัญญา · รายละเอียดที่ยังไม่อยากทำเป็นรายการเงิน
        </li>
      </ul>
    ),
  },
  {
    title: "ภาพรวม · บันทึก · เอกสาร · ตั้งค่า",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong>ภาพรวม</strong> — สรุปเดือนนี้ · กราฟ · เพิ่มรายรับ/รายจ่ายเร็ว · แนบสลิปแล้วดูเต็มจอได้
        </li>
        <li>
          <strong>บันทึก</strong> — ประวัติเต็ม · กรองช่วง/ค้นหา · แก้ไขหรือลบรายการ · สลิปแสดงเฉพาะเมื่อมีรูป
        </li>
        <li>
          <strong>เอกสารหลักฐาน</strong> — เก็บเอกสารระยะยาวแยกจากสลิปรายวัน
        </li>
        <li>
          <strong>ตั้งค่า</strong> — เพิ่ม/แก้/ลบหมวดรายรับและรายจ่ายก่อนบันทึกรายการใหม่
        </li>
      </ul>
    ),
  },
];

function HomeFinanceShellInner({ children }: { children: ReactNode }) {
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
      <div className={cn("flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6", homeFinanceMainPaddingBottomClass)}>
        <header
          className={cn(
            homeFinanceModuleShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-6 sm:py-5",
            headerCollapsed && "hidden",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-[#5b61ff] text-white shadow-sm"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 18h16M7 14l3-3 3 2 4-5" />
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.35" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {HOME_FINANCE_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className={cn(homeFinanceOutlineButtonClass, "w-9 min-w-9 px-0 sm:w-auto sm:min-w-0 sm:px-3")}
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
                className={homeFinanceIconButtonClass}
                aria-pressed={headerCollapsed}
                aria-label="ซ่อนส่วนหัวโมดูล"
                title="ซ่อนส่วนหัวโมดูล"
                suppressHydrationWarning
              >
                <HeaderCollapseGlyph />
              </button>
            </div>
          </div>

          <nav
            className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden"
            aria-label="เมนูระบบบันทึกส่วนตัว"
          >
            <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {HOME_FINANCE_NAV_ITEMS.map((item) => {
                const active = isHomeFinanceNavItemActive(pathname, item.key);
                return (
                  <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                    <Link
                      href={item.href}
                      className={homeFinanceDesktopNavLinkClass(active)}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                        {navIcon(item.key, "h-4 w-4")}
                      </span>
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
          title="คู่มือ — บันทึกส่วนตัว"
          subtitle="ครอบคลุมเมนูหลัก · รหัสผ่าน · โน้ต · บันทึก · เอกสาร · ตั้งค่า"
          sections={guideSections}
        />

        <div className={appModuleShellMainScrollClass}>{children}</div>

        {isHomeFinanceModulePath(pathname) ? (
          <AppMobileDockShell ariaLabel="เมนูล่างระบบบันทึกส่วนตัว">
            <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
              {HOME_FINANCE_NAV_ITEMS.map((item) => {
                const active = isHomeFinanceNavItemActive(pathname, item.key);
                return (
                  <li key={item.key} className="min-w-0">
                    <Link
                      href={item.href}
                      className={appMobileDockLinkClass(active)}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                    >
                      {navIcon(item.key, "h-5 w-5 shrink-0")}
                      <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                        {item.shortLabel}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </AppMobileDockShell>
        ) : null}
      </div>
    </HomeFinanceMobileBottomProvider>
  );
}

export function HomeFinanceShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", homeFinanceMainPaddingBottomClass)}>{children}</div>
      }
    >
      <HomeFinanceShellInner>{children}</HomeFinanceShellInner>
    </Suspense>
  );
}

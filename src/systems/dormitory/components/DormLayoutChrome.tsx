"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { AppUsageGuideModal } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { DormMobileBottomProvider } from "./DormMobileBottomChrome";
import {
  DORMITORY_NAV_ITEMS,
  DORMITORY_HEADER_COLLAPSE_EVENT,
  isDormitoryNavItemActive,
  readDormitoryHeaderCollapsed,
  writeDormitoryHeaderCollapsed,
} from "@/systems/dormitory/dormitory-module-nav";
import {
  dormAccentBarClass,
  dormGlassShellClass,
  dormMainPaddingBottomClass,
  dormNavActiveClass,
  dormNavIdleClass,
} from "@/systems/dormitory/lib/ui-tokens";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
  moduleShopSettingsDesktopNavItem,
  ModuleShopSettingsDesktopNavLink,
} from "@/systems/module-shop/module-shop-settings-nav";

const DORM_MODULE_LABEL = "โมดูล";

function DormHeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
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

function IconHelpCircle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

function DormLayoutChromeInner({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readDormitoryHeaderCollapsed());
    sync();
    window.addEventListener(DORMITORY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DORMITORY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeader = useCallback(() => {
    writeDormitoryHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  const dormIconBadgeClass = cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-indigo-100",
    appDashboardBrandGradientFillClass,
  );

  const dormHeaderCollapseBtnClass =
    "h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-[0.98]";

  const navLinkClass = (active: boolean) =>
    cn(
      "flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
      active ? dormNavActiveClass : dormNavIdleClass,
    );

  return (
    <div className={cn("flex min-h-0 max-w-full flex-1 flex-col gap-3 sm:gap-4", dormMainPaddingBottomClass)}>
      <header
        className={cn(
          dormGlassShellClass,
          "flex flex-col p-4 sm:px-8 sm:py-6 print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className={dormAccentBarClass} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className={dormIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">{DORM_MODULE_LABEL}</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">จัดการหอพัก</h1>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="inline-flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
              aria-haspopup="dialog"
              aria-expanded={usageGuideOpen}
              aria-label="คู่มือการใช้งาน"
              title="คู่มือการใช้งาน"
              suppressHydrationWarning
            >
              <IconHelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </button>
            <button
              type="button"
              onClick={toggleHeader}
              className={cn("inline-flex", dormHeaderCollapseBtnClass)}
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
              suppressHydrationWarning
            >
              <DormHeaderCollapseGlyph collapsed={false} />
            </button>
          </div>
        </div>

        <nav
          aria-label="เมนูหอพัก"
          className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
        >
          <ul className="flex gap-1">
            {DORMITORY_NAV_ITEMS.slice(0, 3).map((item) => {
              const active = isDormitoryNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    className={navLinkClass(active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className={cn("h-4 w-4 shrink-0", active ? "text-white/95" : "text-slate-400")}
                      aria-hidden
                    >
                      {item.key === "dashboard" && (
                        <>
                          <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      )}
                      {item.key === "rooms" && (
                        <>
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
                        </>
                      )}
                      {item.key === "finance" && (
                        <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {moduleShopSettingsDesktopNavItem(
              <ModuleShopSettingsDesktopNavLink
                href={DORMITORY_NAV_ITEMS[3].href}
                active={isDormitoryNavItemActive(pathname, "settings")}
              />,
            )}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — ระบบจัดการหอพัก"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูสำหรับงานบริหารห้องเช่า"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ (หอพักใหม่)",
            content: (
              <>
                <p>
                  เริ่มที่ <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> → ลงทะเบียนห้องและผู้เช่าที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ</strong> → ติดตามยอดและรับชำระที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> · ใช้{" "}
                  <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> เป็นจุดเริ่มทุกวัน
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งค่าหอพัก — ชื่อ · อัตราค่าเช่า/ไฟ/น้ำเริ่มต้น · ช่องทางชำระ · เว็บลูกค้า (ถ้าเปิดพอร์ทัล)</li>
                  <li>เพิ่มห้องในการจัดการ — กำหนดเลขห้อง · ประเภท · ค่าเช่า · สถานะว่าง/มีผู้พัก</li>
                  <li>บันทึกผู้เช่า · สัญญา · เลขมิเตอร์ไฟ–น้ำ · วันเข้าพัก</li>
                  <li>ออกบิลรอบแรกและทดสอบรับชำระ (เงินสด / โอน / พร้อมเพย์ + แนบสลิป)</li>
                  <li>เปิดแดชบอร์ดเช็กห้องค้างชำระ · ห้องว่าง · รายรับเดือนนี้ก่อนเก็บเงินจริง</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนูหลักโมดูล (4 รายการ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong>แดชบอร์ด</strong> — ผังห้อง · สถิติวันนี้ (กริด 2 คอลัมน์บนมือถือ) · ห้องค้างชำระ · ทางลัดไปการจัดการ/การเงิน
                </li>
                <li>
                  <strong>การจัดการ</strong> — รายการห้อง · ผู้พัก · สัญญา · บันทึกมิเตอร์ · ย้ายเข้า/ย้ายออก
                </li>
                <li>
                  <strong>การเงิน</strong> — ประวัติรับชำระ · ออกบิล · รายจ่ายหอพัก · กราฟรายรับ–รายจ่าย
                </li>
                <li>
                  <strong>ตั้งค่า</strong> — ข้อมูลหอพัก · อัตราค่าใช้จ่าย · การเงิน/สลิป · เว็บลูกค้า · ลิงก์ QR
                </li>
                <li>มือถือใช้ dock ล่าง 4 ปุ่ม · เดสก์ท็อปใช้แท็บในการ์ดหัวโมดูล</li>
              </ul>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ผังห้องแบบการ์ด — สี/ป้ายสถานะว่าง · มีผู้พัก · ค้างชำระ · กดห้องเพื่อดูรายละเอียดหรือรับเงิน</li>
                <li>การ์ดสรุป: รายรับเดือนนี้ · ค่าเช่าค้าง · ห้องว่าง · จำนวนผู้พัก — อ่านเร็วก่อนเก็บเงิน</li>
                <li>ห้องที่เลยกำหนดชำระจะมีสัญญาณเตือน (จุด/สี) บนผัง — กดเข้าไปติดตามในการเงิน</li>
                <li>ใช้เป็นหน้าแรกทุกเช้า: ดูว่ามีห้องไหนต้องทวง · ห้องไหนว่างรับผู้เช่าใหม่</li>
              </ul>
            ),
          },
          {
            title: "เมนู: การจัดการ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มห้อง — เลขห้อง · ชั้น · ประเภท (เช่น พัดลม/แอร์) · ค่าเช่ารายเดือน · สถานะ</li>
                <li>ผู้เช่า — ชื่อ · เบอร์ · บัตรประชาชน/สัญญา · วันเริ่ม–สิ้นสุด · เงินประกัน (ถ้ามี)</li>
                <li>มิเตอร์ไฟ/น้ำ — บันทึกเลขก่อน–หลังออกบิล · ระบบคำนวณค่าใช้จ่ายตามอัตราที่ตั้งค่า</li>
                <li>ย้ายเข้า/ย้ายออก — อัปเดตสถานะห้องทันที · ปิดบัญชีค้างก่อนปล่อยห้องว่าง</li>
                <li>กรอง/ค้นหาห้องตามชั้น · สถานะ · ชื่อผู้เช่า — ปุ่มแสดง/ซ่อนกรองทุกขนาดจอ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: การเงิน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  สรุปบน — รายรับ · รายจ่าย · สุทธิ (สีเขียว/ชมพูตามมาตรฐานการเงิน) · กรองช่วง วันนี้/เดือนนี้/ปีนี้/กำหนดเอง
                </li>
                <li>ปุ่มแสดง/ซ่อนกรอง และแสดง/ซ่อนกราฟ แยกกัน — ค่าเริ่มมักซ่อนเพื่อโฟกัสรายการ</li>
                <li>ออกบิล/รับชำระ — เลือกห้อง · รายการค่าเช่า+ไฟ+น้ำ · ชำระเงินสด/โอน/พร้อมเพย์ · แนบสลิป · พิมพ์ใบเสร็จ</li>
                <li>ประวัติรายรับ — ดูย้อนหลัง · แก้ไข/ลบด้วย popup ยืนยัน · ดูสลิปขยายเต็มจอเมื่อมี</li>
                <li>รายจ่าย — หมวดหมู่ · บันทึกค่าใช้จ่ายหอพัก · แนบหลักฐาน · กราฟเปรียบเทียบรายรับ–รายจ่าย</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ตั้งค่า",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>พื้นฐาน — ชื่อหอพัก · ที่อยู่ · ติดต่อ · โลโก้ (ถ้ามี)</li>
                <li>อัตราค่าใช้จ่าย — ค่าเช่าเริ่มต้น · ค่าไฟ/น้ำต่อหน่วย · ค่าส่วนกลาง · รูปแบบปัดเศษ</li>
                <li>การเงิน — บัญชี/พร้อมเพย์ · ขนาดกระดาษพิมพ์ · ฟิลด์ใบกำกับภาษี</li>
                <li>เว็บลูกค้า — แบนเนอร์ · ข้อมูลติดต่อ · ลิงก์ให้ผู้เช่าดูยอด/แจ้งโอน (ตามที่เปิดใช้)</li>
                <li>ลิงก์ QR — คัดลอกลิงก์พอร์ทัล · ดาวน์โหลดโปสเตอร์ · แชร์ให้ผู้เช่าสแกนจ่ายค่าเช่า</li>
              </ul>
            ),
          },
        ]}
      />

      {trialExpiresLabel ? (
        <TrialSandboxStrip>ทดลอง · ข้อมูลแยกจากจริง · หมด {trialExpiresLabel}</TrialSandboxStrip>
      ) : null}

      {children}
    </div>
  );
}

/** โครงเดียวกับ VillageLayoutChrome — หัวข้อระบบ · การ์ดเมนู · แบนเนอร์ทดลอง */
export function DormLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** ข้อความวันหมดอายุที่ format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  return (
    <DormMobileBottomProvider>
      <Suspense
        fallback={
          <div className={cn("flex min-h-0 max-w-full flex-1 flex-col gap-3 sm:gap-4", dormMainPaddingBottomClass)}>
            {children}
          </div>
        }
      >
        <DormLayoutChromeInner trialExpiresLabel={trialExpiresLabel}>
          {children}
        </DormLayoutChromeInner>
      </Suspense>
    </DormMobileBottomProvider>
  );
}

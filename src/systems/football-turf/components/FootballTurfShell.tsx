"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { FootballTurfMobileBottomProvider } from "@/systems/football-turf/components/FootballTurfMobileBottomChrome";
import {
  FOOTBALL_TURF_HEADER_COLLAPSE_EVENT,
  FOOTBALL_TURF_MODULE_DISPLAY_NAME,
  FOOTBALL_TURF_TAB_ITEMS,
  footballTurfTabHref,
  footballTurfTabIcon,
  isFootballTurfTabActive,
  readFootballTurfHeaderCollapsed,
  writeFootballTurfHeaderCollapsed,
} from "@/systems/football-turf/football-turf-module-nav";
import {
  footballTurfAccentBarClass,
  footballTurfGlassShellClass,
  footballTurfMainPaddingBottomClass,
  footballTurfNavActiveClass,
  footballTurfNavIdleClass,
} from "@/systems/football-turf/lib/ui-tokens";

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
        "flex w-full items-center justify-center gap-1.5 rounded-xl px-1 py-3 text-xs font-black transition-all xl:gap-2 xl:text-sm",
        active ? footballTurfNavActiveClass : footballTurfNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
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

function FootballTurfDesktopNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  return (
    <nav
      className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
      aria-label="เมนูโมดูลสนามฟุตบอล"
    >
      <ul className="grid grid-cols-4 gap-2 xl:grid-cols-7">
        {FOOTBALL_TURF_TAB_ITEMS.map((item) => (
          <li key={item.key} className="min-w-0">
            <TabLink
              href={footballTurfTabHref(item.key)}
              label={item.label}
              active={isFootballTurfTabActive(pathname, item.key, tabParam)}
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  {footballTurfTabIcon(item.key)}
                </svg>
              }
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function FootballTurfShell({ children }: { children: React.ReactNode }) {
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readFootballTurfHeaderCollapsed());
    sync();
    window.addEventListener(FOOTBALL_TURF_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FOOTBALL_TURF_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeFootballTurfHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <FootballTurfMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            footballTurfGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={footballTurfAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-5 w-5" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18M3 12h18" strokeLinecap="round" />
                  <path d="M5.5 7.5c2.5 1.5 5 2 6.5 2s4-.5 6.5-2M5.5 16.5c2.5-1.5 5-2 6.5-2s4 .5 6.5 2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {FOOTBALL_TURF_MODULE_DISPLAY_NAME}
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
                <HeaderCollapseGlyph collapsed={false} />
              </button>
            </div>
          </div>

          <Suspense fallback={null}>
            <FootballTurfDesktopNav />
          </Suspense>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือการใช้งาน — สนามฟุตบอล"
          subtitle="วิธีใช้งานแบบละเอียดรายเมนู — แดชบอร์ด · ลิงก์ลูกค้า · โปรโมชั่น"
          sections={[
            {
              title: "ลำดับเริ่มต้นแนะนำ",
              content: (
                <>
                  <p>
                    ตั้งค่าสนามให้ครบก่อนเปิดรับจองออนไลน์ แล้วทดสอบลิงก์ลูกค้า 1 รอบก่อนเปิดจริง
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                    <li>
                      ไปแท็บ <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อสนาม ·
                      พร้อมเพย์/บัญชีโอน · เบอร์ติดต่อ
                    </li>
                    <li>
                      ไปแท็บ <strong className="font-semibold text-[#2e2a58]">จัดการสนาม</strong> — เพิ่ม/แก้ไข/ลบ ·
                      เวลาเปิด–ปิด · ความยาวคิว (นาที) · ราคา · รูปปก
                    </li>
                    <li>
                      สร้างโปรโมชั่นในแท็บ <strong className="font-semibold text-[#2e2a58]">โปรโมชั่น</strong>{" "}
                      (ถ้าขายแพ็กสิทธิ์)
                    </li>
                    <li>
                      เปิดแท็บ <strong className="font-semibold text-[#2e2a58]">QR / ลิงก์</strong> — คัดลอกลิงก์จองและลิงก์เช็กอิน
                      ไปทดสอบบนมือถือ
                    </li>
                    <li>จองทดลอง 1 คิว · แนบสลิปหรือชำระหน้างาน · เช็กอินด้วยเบอร์โทร</li>
                  </ol>
                </>
              ),
            },
            {
              title: "เมนูและการนำทาง",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    แท็บหลัก: ภาพรวม · จอง · การเงิน · โปรโมชั่น · ลูกค้า · จัดการสนาม · QR / ลิงก์ · ตั้งค่า
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">มือถือ</strong> — เมนูล่างสลับแท็บ · กดซ่อนหัวเพื่อพื้นที่เนื้อหา
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">คอมพิวเตอร์</strong> — แท็บอยู่ในส่วนหัว · กดซ่อนหัวแล้วแท็บจะย้ายไปแถบบน
                  </li>
                </ul>
              ),
            },
            {
              title: "แท็บภาพรวม",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ดูตารางสนามตามวันที่เลือก — ช่องว่าง / จองแล้ว / กำลังเล่น / เสร็จสิ้น</li>
                  <li>เพิ่มการจองจากแดชบอร์ด (walk-in หรือจองล่วงหน้า) ระบุสนาม · เวลา · ผู้ติดต่อ</li>
                  <li>สถานะสนามตามเวลา · คิวถัดไป · ปุ่มเช็กอิน/ปิดรอบ</li>
                  <li>ใช้ปุ่มรีเฟรชเมื่อมีหลายเครื่องอัปเดตคิวพร้อมกัน</li>
                </ul>
              ),
            },
            {
              title: "แท็บจัดการสนาม",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เพิ่ม · แก้ไข · ลบสนาม</li>
                  <li>ตั้งเวลาเปิด–ปิด · ความยาวสล็อต · ราคาต่อรอบ</li>
                  <li>แนบรูปปกสนาม (เลือกแกลเลอรีหรือถ่ายกล้อง)</li>
                </ul>
              ),
            },
            {
              title: "แท็บจอง",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>รายการจองแบบการ์ด · กรองช่วงวัน / สถานะ / ต้องปิดงาน — แบบเดียวกับเมนูจองโรงแรม</li>
                  <li>สถานะ: จอง → เช็กอิน → เช็กเอาท์ (หรือยกเลิก)</li>
                  <li>เพิ่มการจองจากปุ่มหัวแท็บ · จัดการสถานะและชำระเงินจากรายการ</li>
                  <li>คิวที่หมดเวลาแล้วจะไม่ให้เช็กอินหรือใช้สิทธิ์โปรต่อ</li>
                </ul>
              ),
            },
            {
              title: "แท็บการเงิน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>สรุปรายรับจากจองสนามและขายโปร · บันทึกรายจ่าย/ต้นทุน</li>
                  <li>กด «ดูกราฟ» เพื่อเทียบรายได้–ต้นทุนรายวันในช่วงที่กรอง</li>
                  <li>ขายโปรโมชั่นให้ลูกค้า: เลือกโปร · กรอกผู้ซื้อ · ชำระเงิน/แนบสลิป</li>
                  <li>ตรวจสลิปโอนในรายการขาย — รูปถูกย่อมาตรฐานก่อนบันทึก</li>
                  <li>กรองตามวัน/ประเภทเพื่อสรุปยอดก่อนปิดกะ</li>
                </ul>
              ),
            },
            {
              title: "แท็บโปรโมชั่น",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>สร้างแพ็ก เช่น «โปร 10 รอบ» — กำหนดจำนวนสิทธิ์ · ราคา · คำอธิบาย</li>
                  <li>
                    หลังขายโปร ลูกค้าจะมีสิทธิ์เหลือตามจำนวนรอบ — ใช้ตัดตอนเช็กอินกับคิวที่จองไว้
                  </li>
                  <li>ปิดหรือแก้ไขโปรที่ไม่ขายแล้ว เพื่อไม่ให้ขายต่อจากแดชบอร์ดโดยไม่ตั้งใจ</li>
                </ul>
              ),
            },
            {
              title: "แท็บลูกค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เก็บเบอร์โทร · ชื่อ · ทีม — ใช้ค้นหาคิวและสิทธิ์โปรในลิงก์เช็กอิน</li>
                  <li>แนะนำให้ใช้เบอร์เดียวกับตอนจองออนไลน์ เพื่อให้ค้นหาเจอครบ</li>
                </ul>
              ),
            },
            {
              title: "แท็บ QR / ลิงก์",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์จองสนาม</strong> — ลูกค้าเลือกสนาม ·
                    ช่วงเวลา · กรอกผู้ติดต่อ · ชำระ/แนบสลิป
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์เช็กอิน</strong> — กรอกเบอร์โทรเพื่อดูคิวและใช้สิทธิ์โปร
                  </li>
                  <li>คัดลอกลิงก์หรือดาวน์โหลดโปสเตอร์ QR ติดหน้าร้าน / ส่งในแชท</li>
                  <li>ทดสอบจากมือถือจริงก่อนแจกลูกค้า — ตรวจว่าพร้อมเพย์และสล็อตว่างถูกต้อง</li>
                </ul>
              ),
            },
            {
              title: "แท็บตั้งค่า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ชื่อสนาม · คำโปรย · ที่อยู่ · เบอร์โทร · LINE</li>
                  <li>พร้อมเพย์ / ธนาคาร / ชื่อบัญชี — ใช้สร้าง QR โอนในหน้าจองและขายโปร</li>
                  <li>เลขผู้เสียภาษี (ถ้ามี) สำหรับเอกสารหน้าร้าน</li>
                  <li>บันทึกแล้วรีเฟรชลิงก์ลูกค้า — ข้อมูลชำระเงินจะอัปเดตตามค่าใหม่</li>
                </ul>
              ),
            },
            {
              title: "ลิงก์จองของลูกค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เลือกวัน · สนาม · ช่วงเวลาที่ยังว่างและยังไม่ผ่านเวลา</li>
                  <li>กรอกชื่อผู้จอง · เบอร์โทร · ชื่อทีม · จำนวนผู้เล่น (กรอกเอง ไม่มีค่าเริ่มต้น)</li>
                  <li>เลือกโอนเงิน (แนบสลิป) หรือชำระหน้างานตามที่ร้านเปิดให้</li>
                  <li>หลังยืนยัน คิวจะเข้าแดชบอร์ดสถานะจองแล้ว — รอตรวจสลิปหรือรับเงินหน้างาน</li>
                </ul>
              ),
            },
            {
              title: "ลิงก์เช็กอิน / ใช้สิทธิ์โปร",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>กรอกเบอร์โทรที่ใช้ตอนจองหรือตอนซื้อโปร — ระบบดึงคิวและสิทธิ์ของเบอร์นั้น</li>
                  <li>
                    การ์ด <strong className="font-semibold text-[#2e2a58]">สิทธิ์ที่ใช้ได้</strong> = รวมจำนวนสิทธิ์ที่เหลือทุกโปร
                    (เช่น โปร 10 รอบ เหลือ 10 → แสดง 10)
                  </li>
                  <li>
                    รายการโปรด้านล่างแสดง <strong className="font-semibold text-[#2e2a58]">เหลือ X/Y สิทธิ์</strong> ของแต่ละแพ็ก
                  </li>
                  <li>กดใช้สิทธิ์กับคิวที่ยังไม่หมดเวลาและยังไม่ผูกโปร — ระบบตัด 1 สิทธิ์ต่อ 1 คิว</li>
                  <li>คิวที่หมดเวลาแล้วหรือผูกโปรแล้วจะกดใช้สิทธิ์ซ้ำไม่ได้</li>
                </ul>
              ),
            },
            {
              title: "การชำระเงินและสลิป",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>โอนเงิน: ลูกค้า/พนักงานแนบรูปสลิป — ระบบย่อรูปมาตรฐานก่อนบันทึก</li>
                  <li>ชำระหน้างาน: บันทึกคิวก่อน แล้วอัปเดตสถานะชำระเมื่อรับเงินจริง</li>
                  <li>ตรวจสลิปจากแดชบอร์ด (ภาพรวม/คิว/การเงิน) ก่อนเริ่มรอบเล่นถ้าต้องการยืนยันยอด</li>
                </ul>
              ),
            },
            {
              title: "เคล็ดลับหน้างาน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>เปิดแท็บคิวบนมือถือพนักงานไว้ตลอดกะ — สลับสถานะเร็วเมื่อลูกค้ามาถึง</li>
                  <li>ขายโปรที่เคาน์เตอร์แล้วให้ลูกค้าใช้ลิงก์เช็กอินด้วยเบอร์เดิมทันที</li>
                  <li>ถ้าค้นหาไม่เจอคิว/สิทธิ์ — ตรวจเบอร์ให้ตรง (ตัวเลขล้วน ไม่มีขีดหรือช่องว่าง)</li>
                  <li>ปิดสนามชั่วคราว: ปรับเวลาเปิด–ปิดหรือปิดรับจองช่วงนั้นจากภาพรวม/ตั้งค่า</li>
                </ul>
              ),
            },
          ]}
        />

        <div className={cn(footballTurfMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </FootballTurfMobileBottomProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppMobileDockShell, appMobileDockGridClass, AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  PARKING_HEADER_COLLAPSE_EVENT,
  PARKING_MODULE_DISPLAY_NAME,
  PARKING_NAV_ITEMS,
  isParkingNavItemActive,
  readParkingHeaderCollapsed,
  writeParkingHeaderCollapsed,
  type ParkingNavKey,
} from "@/systems/parking/parking-module-nav";
import {
  parkingDockItemActiveClass,
  parkingDockItemIdleClass,
  parkingIconBadgeClass,
  parkingModuleHeaderShellClass,
  parkingNavItemActiveClass,
  parkingNavItemBase,
  parkingNavItemIdleClass,
} from "@/systems/parking/parking-ui-tokens";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function IconOffers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" strokeLinecap="round" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .65.37 1.25.97 1.55z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ICONS: Record<ParkingNavKey, typeof IconDashboard> = {
  dashboard: IconDashboard,
  offers: IconOffers,
  finance: IconFinance,
  settings: IconGear,
};

function ParkingHeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

const parkingGuideSections = [
  {
    title: "ลำดับเริ่มต้นแนะนำ",
    content: (
      <>
        <p>ตั้งค่าลานและช่องจอดให้ครบก่อนรับรถจริง แล้วทดสอบ QR ช่องจอดอย่างน้อย 1 ช่อง</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
          <li>
            เปิด <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อลาน · พร้อมเพย์/บัญชี · โหมดราคา ·
            PIN พนักงาน
          </li>
          <li>
            ไป <strong className="font-semibold text-[#2e2a58]">การจัดการ</strong> แท็บ <strong className="font-semibold text-[#2e2a58]">ลาน</strong> — เพิ่มลาน ·
            ตั้งราคาชม./วัน/เดือน · สร้างช่องจอดและ QR
          </li>
          <li>
            สร้าง <strong className="font-semibold text-[#2e2a58]">แพ็กเกจ</strong> และ <strong className="font-semibold text-[#2e2a58]">สมาชิกเหมา</strong> (ถ้าใช้)
          </li>
          <li>
            ตั้งค่า <strong className="font-semibold text-[#2e2a58]">ลิงก์ / QR</strong> และเว็บลูกค้าในแท็บตั้งค่า
          </li>
          <li>ทดลองเช็คอิน 1 คัน · เช็คเอาต์ · ตรวจยอดในการเงิน</li>
        </ol>
      </>
    ),
  },
  {
    title: "เมนูหลัก",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> — ภาพรวม · เช็คอิน · เช็คเอาต์ · การจอง
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">การจัดการ</strong> — แพ็กเกจ · สมาชิกเหมา · ลานและช่องจอด
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — สรุปรายรับ · ประวัติเซสชัน · กราฟ
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — พื้นฐาน · การเงิน · จอง · เว็บลูกค้า · แต้ม · ลิงก์ QR
        </li>
      </ul>
    ),
  },
  {
    title: "แดชบอร์ด",
    content: (
      <>
        <p className="font-semibold text-[#2e2a58]">แท็บย่อย</p>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
          <li>
            <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> — สถานะช่อง (ว่าง / จอง / มีรถจอด) · เลือกลาน ·
            ทางลัดเช็คอิน
          </li>
          <li>
            <strong className="font-semibold text-[#2e2a58]">เช็คอิน</strong> — รับรถเข้าช่อง · เลือกแพ็ก/เหมา · บันทึกทะเบียน ·
            สแกน QR ช่อง (ถ้ามี)
          </li>
          <li>
            <strong className="font-semibold text-[#2e2a58]">เช็คเอาต์</strong> — ปิดรอบจอด · คำนวณค่าจอด · ชำระเงิน · ออกใบเสร็จ
          </li>
          <li>
            <strong className="font-semibold text-[#2e2a58]">การจอง</strong> — จองล่วงหน้า · ยืนยันเมื่อรถมาถึง · ยกเลิก/เลื่อนได้ตามสถานะ
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "การจัดการ",
    content: (
      <>
        <p className="font-semibold text-[#2e2a58]">แพ็กเกจบริการ</p>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
          <li>สร้างแพ็ก เช่น รายชม./รายวัน/รายเดือน — ตั้งชื่อ · ราคา · คำอธิบาย · เปิด/ปิดขาย</li>
          <li>ใช้ตัดสิทธิ์ตอนเช็คอินเมื่อลูกค้ามีแพ็กที่เหมาจ่าย</li>
        </ul>
        <p className="mt-3 font-semibold text-[#2e2a58]">สมาชิกเหมาจ่าย</p>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
          <li>ขายแพ็กให้ลูกค้า · บันทึกทะเบียน/เบอร์ · ดูสิทธิ์คงเหลือ</li>
          <li>เช็คอินแล้วเลือกหักจากแพ็ก — ระบบลดสิทธิ์อัตโนมัติ</li>
        </ul>
        <p className="mt-3 font-semibold text-[#2e2a58]">ลานและช่องจอด</p>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
          <li>เพิ่มลาน · ตั้งโหมดราคา ชม./วัน/เดือน · จำนวนช่อง</li>
          <li>มุมมองช่องจอด — พิมพ์/ดาวน์โหลด QR ติดหลังช่อง · ลูกค้าสแกนเช็คอินได้</li>
        </ul>
      </>
    ),
  },
  {
    title: "การเงิน",
    content: (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
        <li>สรุปรายรับจากรอบจอดที่ชำระแล้ว — กรอง วันนี้/เดือนนี้/ปีนี้/กำหนดเอง</li>
        <li>กด <strong className="font-semibold text-[#2e2a58]">แสดงกรอง</strong> และ <strong className="font-semibold text-[#2e2a58]">แสดงกราฟ</strong> ตามต้องการ</li>
        <li>ประวัติเซสชัน — ทะเบียน · เวลาเข้า–ออก · ยอด · ช่องทางชำระ · สลิป (ถ้ามี)</li>
        <li>ปิดกะ: กรองวันนี้ → รีเฟรช → เทียบยอดกับเงินสด/POS หน้างาน</li>
      </ul>
    ),
  },
  {
    title: "ตั้งค่าและลิงก์ QR",
    content: (
      <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[#4d47b6]">
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่าพื้นฐาน</strong> — ชื่อลาน · ที่อยู่ · เบอร์ · โลโก้
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเกี่ยวกับการเงิน</strong> — พร้อมเพย์ · บัญชี · ขนาดสลิป
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">การจอง</strong> — โหมดมัดจำ/เต็มจำนวน · เปิด–ปิดจองออนไลน์
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเว็ปลิงค์ลูกค้า</strong> — แบนเนอร์ · แกลเลอรี · ช่องทางติดต่อ
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">สะสมคะแนน</strong> — กำหนดบาท→คะแนน (ถ้าเปิดใช้)
        </li>
        <li>
          <strong className="font-semibold text-[#2e2a58]">ลิงก์ / QR</strong> — QR ลาน/ช่อง · ลิงก์พนักงาน · คัดลอก/ดาวน์โหลดโปสเตอร์
        </li>
      </ol>
    ),
  },
];

export function ParkingValetShell({
  siteName,
  children,
}: {
  siteName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [guideOpen, setGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readParkingHeaderCollapsed());
    sync();
    window.addEventListener(PARKING_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PARKING_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeader = useCallback(() => {
    writeParkingHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 pb-24 sm:gap-6 sm:pb-6">
        <div className={cn(parkingModuleHeaderShellClass, "print:hidden", headerCollapsed && "hidden")}>
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className={parkingIconBadgeClass}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                      <path d="M3 14h2l2-3h10l2 3h2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                      <path d="M5 14l1.5-5h11L19 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">โมดูลจอดรถ</p>
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">{PARKING_MODULE_DISPLAY_NAME}</h1>
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#66638c]">{siteName}</p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleHeader}
                  className="inline-flex h-10 min-h-[40px] w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/55 text-[#4d47b6] shadow-sm backdrop-blur-md transition hover:bg-white/75 active:scale-95"
                  aria-expanded={!headerCollapsed}
                  aria-label={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                  title={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                  suppressHydrationWarning
                >
                  <ParkingHeaderCollapseGlyph />
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setGuideOpen(true)}
                  className="flex h-10 min-h-[40px] items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 text-sm font-semibold text-[#4d47b6] shadow-sm backdrop-blur-md transition hover:bg-white/75 sm:px-4"
                  aria-label="เปิดคู่มือการใช้งาน"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1" />
                  </svg>
                  <span className="hidden sm:inline">คู่มือ</span>
                </button>
              </div>
            </div>
          </header>

          <nav aria-label="เมนูโมดูลรับฝากจอดรถ" className="mt-5 hidden border-t border-white/50 pt-5 md:block">
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {PARKING_NAV_ITEMS.map((item) => {
                const active = isParkingNavItemActive(pathname, item.key);
                const Icon = NAV_ICONS[item.key];
                return (
                  <li key={item.href} className="min-w-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(parkingNavItemBase, active ? parkingNavItemActiveClass : parkingNavItemIdleClass)}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>

      <AppMobileDockShell ariaLabel="เมนูล่างรับฝากจอดรถ">
        <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
          {PARKING_NAV_ITEMS.map((item) => {
            const active = isParkingNavItemActive(pathname, item.key);
            const Icon = NAV_ICONS[item.key];
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all active:scale-90",
                    active ? parkingDockItemActiveClass : parkingDockItemIdleClass,
                  )}
                  title={item.label}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                  <span className="max-w-full truncate px-0.5 text-[9px] font-black leading-none">{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือการใช้งาน — บริการรับฝากจอดรถ"
        subtitle="แดชบอร์ด · การจัดการ · การเงิน · ตั้งค่า"
        sections={parkingGuideSections}
      />
    </div>
  );
}

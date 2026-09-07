"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { HotelResortMobileBottomProvider } from "@/systems/hotel-resort/components/HotelResortMobileBottomChrome";
import {
  HOTEL_RESORT_HEADER_COLLAPSE_EVENT,
  HOTEL_RESORT_MODULE_DISPLAY_NAME,
  HOTEL_RESORT_NAV_ITEMS,
  isHotelResortNavItemActive,
  readHotelResortHeaderCollapsed,
  writeHotelResortHeaderCollapsed,
  type HotelResortNavKey,
} from "@/systems/hotel-resort/hotel-resort-module-nav";
import {
  hotelResortAccentBarClass,
  hotelResortGlassShellClass,
  hotelResortMainPaddingBottomClass,
  hotelResortNavActiveClass,
  hotelResortNavIdleClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import {
  IconCalendar,
  IconDoorOpen,
  IconHotel,
  IconNavCheckIn,
  IconNavFinance,
} from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function navIcon(key: HotelResortNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconHotel className={className} />;
    case "rooms":
      return <IconDoorOpen className={className} />;
    case "bookings":
      return <IconCalendar className={className} />;
    case "checkIn":
      return <IconNavCheckIn className={className} />;
    case "finance":
      return <IconNavFinance className={className} />;
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
        active ? hotelResortNavActiveClass : hotelResortNavIdleClass,
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
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function HotelResortShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readHotelResortHeaderCollapsed());
    sync();
    window.addEventListener(HOTEL_RESORT_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOTEL_RESORT_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeHotelResortHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <HotelResortMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            hotelResortGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={hotelResortAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <IconHotel className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {HOTEL_RESORT_MODULE_DISPLAY_NAME}
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

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลโรงแรมรีสอร์ท"
          >
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HOTEL_RESORT_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label}
                    active={isHotelResortNavItemActive(pathname, item.key)}
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
          title="คู่มือโรงแรม / รีสอร์ท"
          subtitle="แดชบอร์ด ห้องพัก จอง เช็คอิน การเงิน · ลิงก์ QR อยู่ในเมนูตั้งค่า"
          sections={[
            {
              title: "ลำดับเริ่มต้นแนะนำ (ที่พักใหม่)",
              content: (
                <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าร้าน</strong> — ชื่อที่พัก · โลโก้ · ติดต่อ · พร้อมเพย์/บัญชี · โหมดมัดจำ/ชำระเต็มบนเว็บ · เวลาเช็คอิน–เช็คเอาต์
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ห้องพัก</strong> — สร้างอาคาร/ตึก · ประเภทห้อง · เพิ่มห้องพร้อมราคาและสถานะ
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์ QR</strong> — แท็บ «ลิงก์ QR» ในตั้งค่า · คัดลอกลิงก์เว็บจอง · ดาวน์โหลดโปสเตอร์ · QR พนักงาน (ถ้าใช้)
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ทดลองจอง</strong> — จองจากแดชบอร์ดหรือเว็บลูกค้า · เช็คอิน · ตรวจการเงินและสลิป
                  </li>
                </ol>
              ),
            },
            {
              title: "เมนูหลักโมดูล (6 รายการ)",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> — สถิติวันนี้ (กริด 2 คอลัมน์บนมือถือ) · ผังห้องสถานะวันนี้ · ปุ่มจอง/เช็คอิน/เช็คเอาต์บนการ์ดห้อง
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ห้องพัก</strong> — จัดการอาคาร · ประเภทห้อง · เพิ่ม/แก้ไข/ปิดใช้ห้อง
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">จอง</strong> — รายการจองล่วงหน้า · กรองช่วงเวลา · เตือนเลยเวลาเช็คอิน/เช็คเอาต์
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">เช็คอิน</strong> — รับแขก walk-in หรือจากการจอง · อัปโหลดรูปบัตร · รับชำระ
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — สรุปรายรับ–รายจ่าย · กรอง · กราฟ · ประวัติผู้เข้าพัก/รายรับ/รายจ่าย
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าร้าน</strong> — พื้นฐาน · การเงิน · เว็บลูกค้า · เวลาเช็คอิน · ลิงก์ QR
                  </li>
                  <li>มือถือใช้ <strong className="font-semibold text-[#2e2a58]">dock ล่าง</strong> 6 ปุ่ม · เดสก์ท็อปใช้แท็บในการ์ดหัวโมดูล</li>
                  <li>
                    ปุ่ม <strong className="font-semibold text-[#2e2a58]">ซ่อนส่วนหัว</strong> ยุบการ์ดชื่อโมดูล — เมนูยังใช้ dock/แถบม่วงได้ · จำค่าในเครื่อง
                  </li>
                </ul>
              ),
            },
            {
              title: "แดชบอร์ด — สถิติ · ผังห้อง",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    ปุ่ม <strong className="font-semibold text-[#2e2a58]">แสดงกรอง / ซ่อนกรอง</strong> คู่รีเฟรช — กรองค้นหา · สถานะ · อาคาร · ประเภทห้อง · «ต้องปิดงาน»
                  </li>
                  <li>
                    ผังอ้างอิง <strong className="font-semibold text-[#2e2a58]">วันนี้</strong> เสมอ (ไม่กรองช่วงวันที่บนผัง — ใช้หน้า «จอง» แทน)
                  </li>
                  <li>
                    การ์ดห้อง — สีเตือน <strong className="font-semibold text-[#2e2a58]">amber</strong> ไม่มาเช็คอิน · <strong className="font-semibold text-[#2e2a58]">rose</strong> ต้องเช็คเอาต์ · แสดงชื่อผู้จองเมื่อเช็คอินแล้ว
                  </li>
                  <li>
                    ห้องว่าง/จอง — ปุ่ม <strong className="font-semibold text-[#2e2a58]">จอง</strong> หรือ <strong className="font-semibold text-[#2e2a58]">เช็คอิน</strong> บนการ์ด · ห้องเข้าพัก — ปุ่ม <strong className="font-semibold text-[#2e2a58]">เช็คเอาต์</strong>
                  </li>
                  <li>ไม่มีแบนเนอร์สรุปด้านบนผัง — อ่านสถานะจากสีและข้อความบนการ์ดแต่ละห้อง</li>
                </ul>
              ),
            },
            {
              title: "จอง — กรอง · สลิป · ปิดงาน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    ชิปช่วง: <strong className="font-semibold text-[#2e2a58]">วันนี้</strong> · เดือนนี้ · ปีนี้ · ช่วงเวลา · ทั้งหมด · ติ๊ก «ต้องปิดงาน» เมื่อเลยเวลาเช็คอิน/เช็คเอาต์
                  </li>
                  <li>
                    ปุ่ม <strong className="font-semibold text-[#2e2a58]">แสดงกรอง / ซ่อนกรอง</strong> ทุกขนาดจอ — มีจุดเตือนเมื่อกรองค้างแต่แผงปิด
                  </li>
                  <li>
                    ชำระมัดจำ/บางส่วน — การ์ดแสดงยอดชำระแล้ว/คงเหลือ · สลิปมัดจำ (<strong className="font-semibold text-[#2e2a58]">depositSlipUrl</strong>) กดดู lightbox
                  </li>
                  <li>
                    โมดัลจัดการจอง — แก้วันเข้าพัก · ห้อง · ยอด · สถานะ · ดูสลิปมัดจำและสลิปชำระเพิ่มแยกกัน
                  </li>
                  <li>ยืนยันลบ/ยกเลิกผ่าน popup กลางจอ — ไม่ใช้ window.confirm</li>
                </ul>
              ),
            },
            {
              title: "เช็คอิน · เช็คเอาต์ — ชำระเงิน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">เช็คอิน</strong> — เลือกห้อง/การจอง · กรอกข้อมูลแขก · ถ่าย/อัปโหลดรูปบัตรประชาชน · สรุปยอดที่ต้องชำระเพิ่ม
                  </li>
                  <li>
                    ช่องทางชำระ: <strong className="font-semibold text-[#2e2a58]">เงินสด</strong> · <strong className="font-semibold text-[#2e2a58]">พร้อมเพย์</strong> · <strong className="font-semibold text-[#2e2a58]">โอนเงิน</strong> · <strong className="font-semibold text-[#2e2a58]">บัตรเครดิต</strong>
                  </li>
                  <li>
                    พร้อมเพย์/โอน — แสดง QR ยอดที่ชำระครั้งนี้ · แนบสลิปได้ (ทางเลือกบนแดชบอร์ด) · เก็บใน <strong className="font-semibold text-[#2e2a58]">paymentSlipUrl</strong> แยกจากสลิปมัดจำ
                  </li>
                  <li>
                    ถ้ามีมัดจำจากเว็บ — แสดงสลิปมัดจำอ่านอย่างเดียว · <strong className="font-semibold text-[#2e2a58]">ห้าม</strong> ทับสลิปมัดจำด้วยสลิปเช็คอิน
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">เช็คเอาต์</strong> — จากผังห้องเข้าพัก · รายการเพิ่ม (มินิบาร์ ฯลฯ) · สรุปยอดคงเหลือ · ชำระครั้งสุดท้ายด้วยแผงเดียวกัน
                  </li>
                </ul>
              ),
            },
            {
              title: "ห้องพัก — อาคาร · ประเภท · ห้อง",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">อาคาร/ตึก</strong> — เพิ่มหลายอาคารเมื่อที่พักมีหลายตึก · ใช้กรองบนผังและรายการจอง
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ประเภทห้อง</strong> — ชื่อ · ราคา · จำนวนที่นอน/สิ่งอำนวยความสะดวก · ใช้ตอนจองและเช็คอิน
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ห้อง</strong> — เลขห้อง · อาคาร · ประเภท · สถานะเปิด/ปิด · แก้ไข/ปิดใช้แทนลบถาวรเมื่อเป็นไปได้
                  </li>
                  <li>เรียงลำดับ: ตั้งโครงสร้างอาคาร → ประเภท → ห้องก่อนเปิดรับจองจริง</li>
                </ul>
              ),
            },
            {
              title: "การเงิน — กรอง · กราฟ · แท็บ",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    การ์ดเดียว «ช่วงเวลาและกราฟ» — ปุ่ม <strong className="font-semibold text-[#2e2a58]">แสดง/ซ่อนกรอง</strong> และ <strong className="font-semibold text-[#2e2a58]">แสดง/ซ่อนกราฟ</strong>
                  </li>
                  <li>
                    ชิปช่วง: วันนี้ · 7 วัน · เดือน · ปี · กำหนดเอง · กราฟใช้โหมด <strong className="font-semibold text-[#2e2a58]">compact</strong> ชุดเดียวทั้งหน้า
                  </li>
                  <li>
                    แท็บในการ์ดรายละเอียด: <strong className="font-semibold text-[#2e2a58]">ประวัติผู้เข้าพัก</strong> · <strong className="font-semibold text-[#2e2a58]">รายรับ</strong> · <strong className="font-semibold text-[#2e2a58]">รายจ่าย</strong>
                  </li>
                  <li>
                    รายจ่าย — จัดการหมวดหมู่ · บันทึกรายการแนบสลิป · แก้/ลบด้วย popup ยืนยัน
                  </li>
                  <li>ราคารายรับสีเขียว · รายจ่ายสีชมพู — ตามมาตรฐานการเงินโมดูล</li>
                </ul>
              ),
            },
            {
              title: "ตั้งค่าร้าน (5 แท็บ)",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าพื้นฐาน</strong> — ชื่อที่พัก · ผู้จัดการ · โลโก้ · สโลแกน · เบอร์ · ที่อยู่ · LINE · Facebook · แผนที่
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเกี่ยวกับการเงิน</strong> — พร้อมเพย์ · บัญชีโอน · โหมดชำระเว็บ (ไม่เก็บ/มัดจำ/เต็ม) · ยอดมัดจำ · ขนาดกระดาษสลิป · PIN พนักงาน
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเว็ปลิงค์ลูกค้า</strong> — แบนเนอร์ · รูปโปรโมท · ข้อความพอร์ทัล · <strong className="font-semibold text-[#2e2a58]">ไม่มี</strong> คัดลอกลิงก์/QR ในแท็บนี้
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเวลาเช็คอิน / เช็คเอาต์</strong> — เวลาเริ่ม–สิ้นสุด (เวลาไทย) · ใช้เตือนเลยเวลาบนรายการจองและผัง
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์ QR</strong> — การ์ดคู่ลิงก์เว็บจอง + QR พนักงาน · คัดลอก · ดาวน์โหลดโปสเตอร์ · บล็อกสายรายวันครั้งเดียว
                  </li>
                  <li>มือถือ — dropdown เลือกแท็บ · เดสก์ท็อป — แถบ pill ในแถวเดียวกับปุ่มบันทึก</li>
                </ul>
              ),
            },
            {
              title: "เว็บจองลูกค้า · มัดจำ · สลิป",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    URL รูปแบบ <strong className="font-semibold text-[#2e2a58]">/hotel-resort/[ownerId]</strong> — แบนเนอร์ · ค้นหาห้องว่าง · เลือกวันเข้า–ออก · กรอกข้อมูลแขก
                  </li>
                  <li>
                    เมื่อมียอดชำระบนเว็บ — เลือก <strong className="font-semibold text-[#2e2a58]">พร้อมเพย์</strong> หรือ <strong className="font-semibold text-[#2e2a58]">โอน</strong> · QR ฝังยอด · <strong className="font-semibold text-[#2e2a58]">บังคับแนบสลิป</strong> ก่อนยืนยันจอง
                  </li>
                  <li>
                    หลังจองสำเร็จ — หน้ารายละเอียดแสดงยอดจอง · ชำระแล้ว · คงเหลือ · สลิปมัดจำกดขยายได้
                  </li>
                  <li>
                    ลิงก์และ QR เปิดจากแท็บ <strong className="font-semibold text-[#2e2a58]">ลิงก์ QR</strong> ในเมนูตั้งค่า — ไม่ปนกับแท็บตั้งค่าเว็บ
                  </li>
                </ul>
              ),
            },
          ]}
        />

        <div className={cn(hotelResortMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </HotelResortMobileBottomProvider>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT,
  ECOMMERCE_STORE_MODULE_DISPLAY_NAME,
  ECOMMERCE_STORE_NAV_ITEMS,
  isEcommerceStoreNavItemActive,
  readEcommerceStoreHeaderCollapsed,
  writeEcommerceStoreHeaderCollapsed,
  type EcommerceStoreNavKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import { EcommerceStoreMobileBottomProvider } from "@/systems/ecommerce-store/components/EcommerceStoreMobileBottomChrome";
import {
  IconClipboard,
  IconFinance,
  IconSettings,
  IconStore,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import {
  ecommerceStoreAccentBarClass,
  ecommerceStoreIconButtonClass,
  ecommerceStoreMainPaddingBottomClass,
  ecommerceStoreModuleIconBadgeClass,
  ecommerceStoreModuleShellClass,
  ecommerceStoreNavLinkClass,
  ecommerceStoreOutlineButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

const navIcons = {
  dashboard: IconStore,
  finance: IconFinance,
  manage: IconClipboard,
  settings: IconSettings,
} as const;

function navIcon(key: EcommerceStoreNavKey, className?: string) {
  const IconCmp = navIcons[key];
  return IconCmp ? <IconCmp className={className} /> : null;
}

function HeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

function EcommerceStoreShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [guideOpen, setGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readEcommerceStoreHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readEcommerceStoreHeaderCollapsed());
    sync();
    window.addEventListener(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeEcommerceStoreHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", ecommerceStoreMainPaddingBottomClass)}>
      <header
        className={cn(
          ecommerceStoreModuleShellClass,
          "flex flex-col px-4 py-4 sm:px-6 sm:py-5",
          headerCollapsed && "hidden",
        )}
      >
        <div className={cn(ecommerceStoreAccentBarClass, "mb-0")} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className={ecommerceStoreModuleIconBadgeClass} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {ECOMMERCE_STORE_MODULE_DISPLAY_NAME}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className={cn(ecommerceStoreOutlineButtonClass, "w-9 min-w-9 px-0 sm:w-auto sm:min-w-0 sm:px-2.5")}
              aria-label="คู่มือการใช้งาน"
              aria-haspopup="dialog"
              aria-expanded={guideOpen}
              suppressHydrationWarning
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </button>
            <button
              type="button"
              onClick={toggleHeaderCollapse}
              className={ecommerceStoreIconButtonClass}
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
              suppressHydrationWarning
            >
              <HeaderCollapseGlyph />
            </button>
          </div>
        </div>

        <nav aria-label="เมนูร้านออนไลน์" className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ECOMMERCE_STORE_NAV_ITEMS.map((item) => {
              const active = isEcommerceStoreNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link
                    href={item.href}
                    className={ecommerceStoreNavLinkClass(active)}
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
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือการใช้งาน — ร้านออนไลน์"
        subtitle="แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า · เว็บลูกค้า"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ (ร้านใหม่)",
            content: (
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — ชื่อร้าน · โลโก้ · พร้อมเพย์/บัญชี · ตั้งค่าเว็บไซต์ (LINE · โดเมน · Sale Page)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ → สินค้า</strong> — เพิ่มสินค้า · รูปปก+มุมอื่น · หมวด · สต๊อก · ติ๊ก «แสดงบนเว็บไซต์»
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ลิงก์</strong> — แท็บลิงก์ในตั้งค่า · คัดลอก <strong className="font-semibold text-[#2e2a58]">/shop/[storeId]</strong> · QR พนักงาน
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ทดลองขาย</strong> — สั่งจากเว็บ · ตรวจสลิปที่ออเดอร์ออนไลน์ · ทด POS หน้าร้าน
                </li>
              </ol>
            ),
          },
          {
            title: "เมนูหลักโมดูล (4 รายการ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> — ภาพรวม · ออเดอร์ออนไลน์ · ขายหน้าร้าน (แท็บย่อย)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — สรุปออนไลน์/หน้าร้าน · รายจ่าย · กรอง · กราฟ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">การจัดการ</strong> — สินค้า (รวมสต๊อก) · CRM (แท็บย่อย)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> — พื้นฐาน · การเงิน · ตั้งค่าเว็บไซต์ · ลิงก์
                </li>
                <li>
                  มือถือใช้ <strong className="font-semibold text-[#2e2a58]">dock ล่าง</strong> 4 ปุ่ม · กดไอคอนซ่อนหัวเพื่อย้ายเมนูขึ้นแถบม่วงบนเดสก์ท็อป
                </li>
              </ul>
            ),
          },
          {
            title: "แดชบอร์ด — ภาพรวม · ออเดอร์ออนไลน์ · ขายหน้าร้าน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ภาพรวม</strong> — สถิติยอดขาย · ออเดอร์รอ · สต๊อกใกล้หมด (กริด 2 คอลัมน์บนมือถือ)
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ออเดอร์ออนไลน์</strong> — ตรวจสลิป · อัปเดตสถานะ (รอชำระ → จัดส่ง) · ดูที่อยู่จัดส่ง
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ขายหน้าร้าน</strong> — POS เลือกสินค้า · ตะกร้า · ชำระเงินสด/โอน · ตัดสต๊อกทันที
                </li>
                <li>ปุ่มแก้ไข/ลบ/พิมพ์บนการ์ดออเดอร์เป็นไอคอน — มี aria-label</li>
              </ul>
            ),
          },
          {
            title: "การเงิน — กรอง · กราฟ · ประวัติ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  ค่าเริ่ม <strong className="font-semibold text-[#2e2a58]">เดือนนี้</strong> — ปุ่มแสดง/ซ่อนกรองและกราฟในการ์ดเดียว
                </li>
                <li>
                  สรุปแยก <strong className="font-semibold text-[#2e2a58]">ออนไลน์</strong> · <strong className="font-semibold text-[#2e2a58]">หน้าร้าน</strong> · รายจ่าย · สุทธิ
                </li>
                <li>
                  กราฟเปรียบเทียบช่องทาง — โหมด <strong className="font-semibold text-[#2e2a58]">compact</strong> · แท็บประวัติออเดอร์และรายจ่าย
                </li>
                <li>รายจ่าย — บันทึกหมวด · แนบสลิป · แก้/ลบด้วย popup ยืนยัน</li>
              </ul>
            ),
          },
          {
            title: "การจัดการ — สินค้า · CRM",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">สินค้า</strong> — กรองทั้งหมด/ใกล้หมด/หมด/ซ่อนเว็บ · ค้นหา · ± สต๊อก · Export Excel
                </li>
                <li>
                  ฟอร์มสินค้า — 3 แผง: ข้อมูลพื้นฐาน · การแสดงบนเว็บ (ติ๊กแสดง/เด่น/แนะนำ) · รูปปก+มุมอื่น (ย่อก่อนอัปโหลด)
                </li>
                <li>
                  แท็บ <strong className="font-semibold text-[#2e2a58]">CRM</strong> — รายชื่อลูกค้า · ยอดซื้อสะสม · ประวัติออเดอร์
                </li>
                <li>ปุ่มเพิ่มสินค้า/หมวด — เปิด FormModal กลางจอ ไม่ใช่ฟอร์มยาวถาวรบนหน้า</li>
              </ul>
            ),
          },
          {
            title: "ตั้งค่าร้าน (4 แท็บ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าพื้นฐาน</strong> — ชื่อ · โลโก้ · สโลแกน · เบอร์ · ที่อยู่ · นโยบายสต๊อก
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเกี่ยวกับการเงิน</strong> — พร้อมเพย์ · บัญชี · ขนาดสลิป · หมายเหตุชำระ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเว็บไซต์</strong> — LINE · Facebook · แผนที่ · โดเมนส่วนตัว · Sale Page · <strong className="font-semibold text-[#2e2a58]">ไม่มี</strong> คัดลอกลิงก์/QR
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">ลิงก์</strong> — การ์ดคู่ลิงก์เว็บไซต์+พนักงาน · บล็อกสายรายวันครั้งเดียว
                </li>
              </ul>
            ),
          },
          {
            title: "PromptPay · Sale Page · โดเมน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  ใส่เบอร์พร้อมเพย์ในแท็บการเงิน — หน้า checkout ลูกค้าเห็น <strong className="font-semibold text-[#2e2a58]">QR ฝังยอด</strong> อัตโนมัติ
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">Sale Page</strong> — ในแท็บตั้งค่าเว็บไซต์ เลือกสินค้าเด่น + เปิดโหมด · ลิงก์เปิดจากแท็บลิงก์
                </li>
                <li>
                  <strong className="font-semibold text-[#2e2a58]">โดเมนส่วนตัว</strong> — ชี้ CNAME มา MAWELL → บันทึก → กดยืนยัน · ลูกค้าเข้า shop.yourbrand.com
                </li>
              </ul>
            ),
          },
          {
            title: "เว็บลูกค้า · ตะกร้า · ชำระเงิน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  หน้าร้าน <strong className="font-semibold text-[#2e2a58]">/shop/[storeId]</strong> — กริดสินค้า · หมวดเลื่อนแนวนอน · คลิกการ์ดเปิดโมดัลรายละเอียด
                </li>
                <li>
                  ตะกร้า → checkout — ที่อยู่จัดส่ง · พร้อมเพย์/โอน · แนบสลิป (ถ่าย/แกลเลอรี) · ยืนยันออเดอร์
                </li>
                <li>
                  หลังสั่ง — ไปหน้าสรุป <strong className="font-semibold text-[#2e2a58]">/shop/…/order/[code]</strong> · ติดตามสถานะ · รีวิวเมื่อจัดส่งแล้ว
                </li>
                <li>QR พนักงาน — เข้าได้เฉพาะแดชบอร์ดและเว็บร้าน (ไม่ใช่เมนูหลัก MAWELL)</li>
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

export function EcommerceStoreShell({ children }: { children: React.ReactNode }) {
  return (
    <EcommerceStoreMobileBottomProvider>
      <EcommerceStoreShellInner>{children}</EcommerceStoreShellInner>
    </EcommerceStoreMobileBottomProvider>
  );
}

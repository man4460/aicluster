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
            title: "เริ่มต้น",
            content:
              "ตั้งค่าร้าน → การจัดการ → เพิ่มสินค้าและรูป → คัดลอกลิงก์ /shop แชร์ลูกค้า → ตรวจสลิปที่แท็บออเดอร์",
          },
          {
            title: "เมนูหลัก",
            content:
              "แดชบอร์ด (ภาพรวม · ออเดอร์ออนไลน์ · ขายหน้าร้าน) · การเงิน · การจัดการ (สินค้า · CRM) · ตั้งค่า — มือถือใช้เมนูล่าง · เดสก์ท็อปใช้แท็บในหัว · กดไอคอนซ่อนหัวเพื่อย้ายเมนูขึ้นแถบม่วง",
          },
          {
            title: "แดชบอร์ด — ภาพรวม · ออเดอร์ออนไลน์ · ขายหน้าร้าน",
            content:
              "ภาพรวมแสดงสถิติร้าน · ออเดอร์ออนไลน์สำหรับตรวจสลิป/อัปเดตสถานะ · ขายหน้าร้านเป็น POS ตัดสต๊อกทันที · การเงินแยกรายรับออนไลน์กับหน้าร้าน",
          },
          {
            title: "การเงิน",
            content:
              "สรุปออนไลน์ · หน้าร้าน · รายจ่าย · สุทธิ · กรองช่วงเวลา · กราฟเปรียบเทียบช่องทาง · แท็บประวัติออเดอร์และรายจ่าย — ค่าเริ่มต้นเดือนนี้",
          },
          {
            title: "การจัดการ",
            content:
              "แท็บสินค้า (รวมสต๊อก · Excel · หมวด · รูป) และแท็บ CRM (ลูกค้า · ยอดซื้อ) — สลับจากแถบย่อยในการ์ดเดียวกัน",
          },
          {
            title: "ตั้งค่าร้าน",
            content:
              "แยกหมวด พื้นฐาน · การเงิน · ลิงก์เว็บ · พนักงาน — ลิงก์แชร์ร้าน/โดเมน/Sale Page อยู่แท็บลิงก์เว็บ · QR พนักงานอยู่แท็บพนักงาน · มือถือเลือกจาก dropdown",
          },
          {
            title: "PromptPay",
            content: "ใส่เบอร์พร้อมเพย์ในตั้งค่าการเงิน — หน้าชำระเงินลูกค้าจะเห็น QR ฝังยอดอัตโนมัติ",
          },
          {
            title: "Sale Page",
            content:
              "ในแท็บลิงก์เว็บ เลือกสินค้าเด่น + เปิดโหมด Sale Page — เหมาะโพสต์ TikTok/FB จบในหน้าเดียว",
          },
          {
            title: "ลิงก์พนักงาน",
            content:
              "แท็บพนักงาน สร้าง QR/ลิงก์ถาวร — พนักงานเข้าได้เฉพาะแดชบอร์ด (ภาพรวม · ออเดอร์ · POS) และเว็บร้าน ไม่เปิดการเงิน/จัดการ/ตั้งค่า",
          },
          {
            title: "โดเมนส่วนตัว",
            content:
              "ชี้ CNAME มา MAWELL → บันทึกโดเมน → กดยืนยันโดเมน — ลูกค้าเข้า shop.yourbrand.com ได้โดยไม่เห็น /shop/id",
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

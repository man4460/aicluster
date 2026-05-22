"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_NAV_LINKS, deriveEcommerceSection } from "@/systems/ecommerce-store/ecommerce-nav";
import { EcommerceStoreMobileDock } from "@/systems/ecommerce-store/components/EcommerceStoreMobileDock";
import {
  ecommerceGuideButtonClass,
  ecommerceIconBadgeClass,
  ecommerceModuleHeaderShellClass,
  ecommerceNavItemActiveClass,
  ecommerceNavItemBase,
  ecommerceNavItemIdleClass,
} from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";
import {
  IconClipboard,
  IconPackage,
  IconSettings,
  IconStore,
  IconUsers,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

const navIcons = {
  dashboard: IconStore,
  products: IconPackage,
  orders: IconClipboard,
  customers: IconUsers,
  settings: IconSettings,
} as const;

export function EcommerceStoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const section = deriveEcommerceSection(pathname);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className={cn(ecommerceModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className={ecommerceIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b87b8]">กลุ่ม 1 · 1 โทเคน/วัน</p>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ร้านออนไลน์</h1>
                <p className="mt-0.5 hidden text-xs font-medium text-[#66638c] sm:block">
                  สร้างร้าน · จัดการสต๊อก · รับออเดอร์และสลิป
                </p>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setGuideOpen(true)} className={ecommerceGuideButtonClass}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 7h.01" strokeLinecap="round" />
            </svg>
            คู่มือ
          </button>
        </div>
        <nav className="mt-4 hidden gap-2 sm:grid sm:grid-cols-5" aria-label="เมนูร้านออนไลน์">
          {ECOMMERCE_NAV_LINKS.map((item) => {
            const active = section === item.section;
            const Icon = navIcons[item.section];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(ecommerceNavItemBase, "w-full", active ? ecommerceNavItemActiveClass : ecommerceNavItemIdleClass)}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
      <EcommerceStoreMobileDock />
      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือร้านออนไลน์"
        sections={[
          {
            title: "เริ่มต้น",
            content:
              "ตั้งค่าร้าน → เพิ่มสินค้าและรูป → คัดลอกลิงก์ /shop แชร์ลูกค้า → ตรวจสลิปที่แท็บออเดอร์",
          },
          {
            title: "PromptPay",
            content: "ใส่เบอร์พร้อมเพย์ในตั้งค่า — หน้าชำระเงินลูกค้าจะเห็น QR ฝังยอดอัตโนมัติ",
          },
          {
            title: "Sale Page",
            content:
              "เลือกสินค้าเด่นในตั้งค่า + เปิดโหมด Sale Page — เหมาะโพสต์ TikTok/FB จบในหน้าเดียว",
          },
          {
            title: "โดเมนส่วนตัว",
            content:
              "ชี้ CNAME มา MAWELL → บันทึกโดเมน → กดยืนยันโดเมน — ลูกค้าเข้า shop.yourbrand.com ได้โดยไม่เห็น /shop/id",
          },
        ]}
      />
    </div>
  );
}

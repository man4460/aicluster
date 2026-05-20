"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ECOMMERCE_NAV_LINKS, deriveEcommerceSection } from "@/systems/ecommerce-store/ecommerce-nav";
import { EcommerceStoreMobileDock } from "@/systems/ecommerce-store/components/EcommerceStoreMobileDock";
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

const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

export function EcommerceStoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const section = deriveEcommerceSection(pathname);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className="app-surface rounded-[2rem] px-4 py-4 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#8b87b8]">กลุ่ม 1 · 1 โทเคน/วัน</p>
            <h1 className="font-black tracking-tight text-[#1e1b4b] text-xl sm:text-2xl">
              E-Commerce Store Builder
            </h1>
            <p className="mt-1 text-sm text-[#66638c]">สร้างร้าน · จัดการสต๊อก · รับออเดอร์และสลิป</p>
          </div>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/80 px-3 text-sm font-semibold text-[#4d47b6]"
          >
            คู่มือ
          </button>
        </div>
        <nav
          className="mt-4 hidden gap-2 sm:grid sm:grid-cols-5"
          aria-label="เมนูร้านออนไลน์"
        >
          {ECOMMERCE_NAV_LINKS.map((item) => {
            const active = section === item.section;
            const Icon = navIcons[item.section];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  navItemBase,
                  "w-full",
                  active
                    ? "bg-gradient-to-br from-[#ede9ff] via-white to-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                    : "app-btn-soft text-[#66638c]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
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

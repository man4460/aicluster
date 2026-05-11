"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { InventoryMobileDock } from "@/systems/inventory/components/InventoryMobileDock";

const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

function NavItem({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        navItemBase,
        "w-full sm:w-auto",
        active
          ? "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100/60 text-emerald-800 ring-1 ring-teal-500/25"
          : "app-btn-soft text-[#566175]",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}

type InventoryNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

const navLinks: readonly InventoryNavItem[] = [
  { href: "/dashboard/inventory", label: "ภาพรวม", icon: IconDashboard },
  { href: "/dashboard/inventory/items", label: "สินค้า", icon: IconBox },
  { href: "/dashboard/inventory/warehouses", label: "คลัง", icon: IconWarehouse },
  { href: "/dashboard/inventory/movements", label: "เคลื่อนไหว", icon: IconArrows },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/inventory") return pathname === "/dashboard/inventory";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InventoryShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header className="-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200/60">
              <IconWarehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Inventory</p>
              <h1 className="text-xl font-black tracking-tight text-[#1f2937] sm:text-2xl">
                คลัง · สต๊อกสินค้า
              </h1>
              <p className="mt-0.5 hidden max-w-xl text-xs leading-snug text-[#566175] md:block">
                จัดการคลังหลายสาขา · สต๊อกแบบเรียลไทม์ · รับเข้า–เบิกออก–โอน + แจ้งของใกล้หมด
              </p>
            </div>
          </div>
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setGuideOpen(true)}
            className="app-btn-soft min-h-[44px] shrink-0 rounded-xl border border-teal-200 bg-white/80 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 sm:px-4 sm:py-2.5"
            aria-haspopup="dialog"
            aria-expanded={guideOpen}
            aria-label="เปิดคู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
          >
            <span className="sm:hidden" aria-hidden>?</span>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>

        <nav
          aria-label="เมนู คลังสต๊อกสินค้า"
          className="mt-3 hidden border-t border-white/60 pt-3 md:block sm:mt-4 sm:pt-4"
        >
          <ul className="grid grid-cols-4 gap-2">
            {navLinks.map(({ href, label, icon }) => (
              <li key={href} className="min-w-0">
                <NavItem href={href} icon={icon} active={navActive(pathname, href)}>
                  {label}
                </NavItem>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือการใช้งาน — คลังสต๊อกสินค้า"
        subtitle="ตั้งคลัง · เพิ่มสินค้า · บันทึกการเคลื่อนไหว"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-emerald-700">
                <li>เพิ่ม «คลัง» อย่างน้อย 1 แห่ง (เช่น คลังหลัก / สาขา 1)</li>
                <li>สร้างหมวดสินค้าและเพิ่มสินค้า (SKU, ทุน, ราคาขาย, จุดสั่งซื้อ)</li>
                <li>บันทึกการ «รับเข้า» ครั้งแรก — สต๊อกจะอัปเดตอัตโนมัติ</li>
                <li>ใช้ «เบิกออก» / «โอน» / «ปรับยอด» ในงานประจำวัน</li>
              </ol>
            ),
          },
          {
            title: "ภาพรวม",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-emerald-700">
                <li>สรุปสินค้าทั้งหมด · มูลค่ารวมตามทุน · ของใกล้หมด · เคลื่อนไหววันนี้</li>
                <li>รายการของใกล้หมด — แสดงเมื่อสต๊อกรวมต่ำกว่าจุดสั่งซื้อ</li>
              </ul>
            ),
          },
          {
            title: "สินค้า · คลัง · เคลื่อนไหว",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-emerald-700">
                <li>เมนู «สินค้า» — เพิ่ม/แก้ไข SKU, ชื่อ, หมวด, ทุน, ราคาขาย, จุดสั่งซื้อ, รูป</li>
                <li>เมนู «คลัง» — เพิ่มที่เก็บสินค้า + จัดการหมวดสินค้า</li>
                <li>เมนู «เคลื่อนไหว» — รับเข้า / เบิกออก / โอนระหว่างคลัง / ปรับยอด พร้อมประวัติ</li>
              </ul>
            ),
          },
        ]}
      />

      <div className="-mx-3 pb-24 sm:mx-0 sm:pb-0">{children}</div>
      <InventoryMobileDock />
    </div>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconWarehouse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 9 12 4l9 5v11H3z" strokeLinejoin="round" />
      <path d="M7 20v-7h10v7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-3h4v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

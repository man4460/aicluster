"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { InventoryMobileDock } from "@/systems/inventory/components/InventoryMobileDock";
import {
  INVENTORY_HEADER_COLLAPSE_EVENT,
  INVENTORY_MODULE_DISPLAY_NAME,
  INVENTORY_NAV_ITEMS,
  inventoryNavActive,
  readInventoryHeaderCollapsed,
  writeInventoryHeaderCollapsed,
  type InventoryNavKey,
} from "@/systems/inventory/inventory-module-nav";

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

const NAV_ICONS: Record<InventoryNavKey, (props: { className?: string }) => React.ReactNode> = {
  overview: IconDashboard,
  items: IconBox,
  warehouses: IconWarehouse,
  movements: IconArrows,
};

function InventoryHeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

export function InventoryShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [guideOpen, setGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readInventoryHeaderCollapsed());
    sync();
    window.addEventListener(INVENTORY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INVENTORY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeader = useCallback(() => {
    writeInventoryHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header
        className={cn(
          "-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200/60">
              <IconWarehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Inventory</p>
              <h1 className="text-xl font-black tracking-tight text-[#1f2937] sm:text-2xl">
                {INVENTORY_MODULE_DISPLAY_NAME}
              </h1>
              <p className="mt-0.5 hidden max-w-xl text-xs leading-snug text-[#566175] md:block">
                จัดการคลังหลายสาขา · สต๊อกแบบเรียลไทม์ · รับเข้า–เบิกออก–โอน + แจ้งของใกล้หมด
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleHeader}
              className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-xl border border-teal-200 bg-white/80 text-emerald-800 shadow-sm transition hover:bg-emerald-50 active:scale-95"
              aria-expanded={!headerCollapsed}
              aria-label={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
              title={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
              suppressHydrationWarning
            >
              <InventoryHeaderCollapseGlyph />
            </button>
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
        </div>

        <nav
          aria-label="เมนู คลังสต๊อกสินค้า"
          className="mt-3 hidden border-t border-white/60 pt-3 md:block sm:mt-4 sm:pt-4"
        >
          <ul className="grid grid-cols-4 gap-2">
            {INVENTORY_NAV_ITEMS.map(({ key, href, label }) => {
              const Icon = NAV_ICONS[key];
              return (
                <li key={href} className="min-w-0">
                  <NavItem href={href} icon={Icon} active={inventoryNavActive(pathname, href)}>
                    {label}
                  </NavItem>
                </li>
              );
            })}
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
            title: "ลำดับเริ่มต้นแนะนำ (คลังใหม่)",
            content: (
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>เมนู <strong>คลัง</strong> — สร้างที่เก็บอย่างน้อย 1 แห่ง (คลังหลัก · สาขา · หน้าร้าน)</li>
                <li>ตั้งหมวดสินค้าในคลัง — แยกตามประเภท เช่น วัตถุดิบ · สินค้าพร้อมขาย · อะไหล่</li>
                <li>เมนู <strong>สินค้า</strong> — เพิ่ม SKU · ชื่อ · หน่วย · ทุน · ราคาขาย · จุดสั่งซื้อ (reorder) · รูป</li>
                <li>เมนู <strong>เคลื่อนไหว</strong> — บันทึก <strong>รับเข้า</strong> ครั้งแรกเพื่อตั้งยอดเปิด</li>
                <li>ใช้งานประจำวัน: เบิกออก · โอนระหว่างคลัง · ปรับยอด (ของเสีย/นับสต๊อก) · ตรวจภาพรวมทุกเช้า</li>
              </ol>
            ),
          },
          {
            title: "เมนูหลักโมดูล (4 รายการ)",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong>ภาพรวม</strong> — สถิติสต๊อก · มูลค่าทุนรวม · สินค้าใกล้หมด · เคลื่อนไหววันนี้
                </li>
                <li>
                  <strong>สินค้า</strong> — รายการ SKU · กรองหมวด/สถานะ · เพิ่ม/แก้ไข/ปิดใช้งาน
                </li>
                <li>
                  <strong>คลัง</strong> — จัดการที่เก็บ · หมวดสินค้า · ดูยอดคงเหลือแยกตามคลัง
                </li>
                <li>
                  <strong>เคลื่อนไหว</strong> — รับเข้า · เบิกออก · โอน · ปรับยอด · ประวัติย้อนหลัง
                </li>
                <li>มือถือใช้ dock ล่าง 4 ปุ่ม · เดสก์ท็อปใช้แท็บในการ์ดหัว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ภาพรวม",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>การ์ดสรุป — จำนวน SKU · มูลค่ารวมตามทุน · รายการใกล้หมด · จำนวนเคลื่อนไหววันนี้ (กริด 2 คอลัมน์บนมือถือ)</li>
                <li>รายการ «ใกล้หมด» — แสดงเมื่อคงเหลือ ≤ จุดสั่งซื้อ · ใช้วางแผนสั่งของ</li>
                <li>เคลื่อนไหวล่าสุด — ตรวจว่ามีรับเข้า/เบิกผิดคลังหรือไม่ก่อนปิดวัน</li>
                <li>ทางลัดไปเมนูสินค้า/เคลื่อนไหวจากการ์ดหรือ dock</li>
              </ul>
            ),
          },
          {
            title: "เมนู: สินค้า",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มสินค้า — SKU (ไม่ซ้ำ) · ชื่อ · หมวด · หน่วยนับ · ทุนต่อหน่วย · ราคาขาย · จุดสั่งซื้อ</li>
                <li>แนบรูปสินค้า — อัปโหลดย่อก่อนส่ง · ดูขยายเต็มจอจากรายการ</li>
                <li>กรอง — หมวด · สถานะเปิด/ปิด · ค้นหาชื่อ/SKU · ปุ่มแสดง/ซ่อนกรอง</li>
                <li>แก้ไข/ลบ — ไอคอนแถว · ยืนยันก่อนลบ · ปิดใช้งานแทนลบถ้ายังมีประวัติเคลื่อนไหว</li>
                <li>ดูยอดคงเหลือรวมทุกคลังต่อ SKU ในรายละเอียดสินค้า</li>
              </ul>
            ),
          },
          {
            title: "เมนู: คลัง",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มคลัง — ชื่อ · ที่อยู่/สาขา · หมายเหตุ · เปิด/ปิดใช้งาน</li>
                <li>หมวดสินค้า — จัดกลุ่มในรายงานและหน้าสินค้า · เรียงลำดับได้</li>
                <li>ดูยอดคงเหลือแยกตามคลัง — ใช้ก่อนโอนสินค้าระหว่างสาขา</li>
                <li>อย่าลบคลังที่มียอดค้าง — โอนหรือเบิกให้หมดก่อน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: เคลื่อนไหว",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>
                  <strong>รับเข้า</strong> — เลือกสินค้า · คลังปลายทาง · จำนวน · อ้างอิงใบส่งของ/PO · ยอดสต๊อกเพิ่มทันที
                </li>
                <li>
                  <strong>เบิกออก</strong> — ขาย/ใช้ในงาน · ระบุคลังต้นทาง · จำนวน · เหตุผล
                </li>
                <li>
                  <strong>โอน</strong> — ย้ายระหว่างคลัง · ลดต้นทาง · เพิ่มปลายทางในบันทึกเดียว
                </li>
                <li>
                  <strong>ปรับยอด</strong> — นับสต๊อกจริง · ของเสีย · แก้ยอดผิดพลาด · ต้องระบุเหตุผล
                </li>
                <li>ประวัติ — กรองวันที่ · ประเภท · สินค้า · ดูผู้บันทึกและเวลา (เวลาไทย Asia/Bangkok)</li>
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

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  drinkPosAccentBarClass,
  drinkPosGlassShellClass,
  drinkPosMainPaddingBottomClass,
  drinkPosNavActiveClass,
  drinkPosNavIdleClass,
} from "@/systems/drink-pos/lib/ui-tokens";
import { DrinkPosMobileBottomProvider } from "@/systems/drink-pos/components/DrinkPosMobileBottomChrome";
import {
  DRINK_POS_HEADER_COLLAPSE_EVENT,
  DRINK_POS_NAV_ITEMS,
  DRINK_POS_ORDER_HREF,
  isDrinkPosNavItemActive,
  readDrinkPosHeaderCollapsed,
  writeDrinkPosHeaderCollapsed,
  type DrinkPosNavKey,
} from "@/systems/drink-pos/lib/drink-pos-module-nav";

function IconTabOrder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 3h12v4H6zM7 7v13h10V7" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h4" strokeLinecap="round" />
    </svg>
  );
}

function IconTabProducts({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 8h15l-1.5 9H7.5L6 8zM6 8L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21a1 1 0 002 0M16 21a1 1 0 002 0" strokeLinecap="round" />
    </svg>
  );
}

function IconTabSales({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTabMembers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" />
      <path d="M16 7l1.5 1.5M18 4v3M21 5.5h-3" strokeLinecap="round" />
    </svg>
  );
}

function IconTabSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTabOrdersQueue({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: DrinkPosNavKey, className?: string) {
  switch (key) {
    case "order":
      return <IconTabOrder className={className} />;
    case "orders":
      return <IconTabOrdersQueue className={className} />;
    case "products":
      return <IconTabProducts className={className} />;
    case "finance":
      return <IconTabSales className={className} />;
    case "settings":
      return <IconTabSettings className={className} />;
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
        active ? drinkPosNavActiveClass : drinkPosNavIdleClass,
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

export function DrinkPosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const onOrderPage = pathname === DRINK_POS_ORDER_HREF || pathname.startsWith(`${DRINK_POS_ORDER_HREF}/`);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readDrinkPosHeaderCollapsed());
    sync();
    window.addEventListener(DRINK_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DRINK_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeDrinkPosHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <DrinkPosMobileBottomProvider>
      <div
        className={cn(
          "flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6",
          onOrderPage && "lg:h-full lg:max-h-full lg:overflow-hidden lg:gap-3",
        )}
      >
        <header
          className={cn(
            drinkPosGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={drinkPosAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-5 w-5" aria-hidden>
                  <path d="M8 3h8l1 4H7l1-4zM6 7h12v2a5 5 0 01-5 5 5 5 0 01-5-5V7z" strokeLinejoin="round" />
                  <path d="M9 14v4M12 14v4M15 14v4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  POS ร้านเครื่องดื่ม
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
            aria-label="เมนูโมดูล POS ร้านเครื่องดื่ม"
          >
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DRINK_POS_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isDrinkPosNavItemActive(pathname, item.key)}
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
          title="คู่มือการใช้งาน — POS ร้านเครื่องดื่ม"
          subtitle="ออร์เดอร์ สินค้า และยอดขาย"
          sections={[
            {
              title: "ลำดับเริ่มต้นแนะนำ",
              content: (
                <>
                  <p>ตั้งค่าร้านและเมนูให้พร้อมก่อนรับออเดอร์จริง แล้วทดสอบลิงก์ลูกค้าและแผนกทำอย่างน้อย 1 รอบ</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                    <li>
                      เปิด <strong className="font-semibold text-[#2e2a58]">ตั้งค่าร้าน</strong> — ชื่อร้าน · พร้อมเพย์/บัญชี ·
                      ขนาดสลิป · เวลาเปิดร้าน
                    </li>
                    <li>
                      ไป <strong className="font-semibold text-[#2e2a58]">สินค้า</strong> — สร้างหมวด · เพิ่มเมนู ราคา รูป ·
                      เปิดขาย
                    </li>
                    <li>
                      ตั้งค่า <strong className="font-semibold text-[#2e2a58]">สะสมคะแนน</strong> (ถ้าใช้) ในแท็บตั้งค่า
                    </li>
                    <li>
                      เปิดแท็บ <strong className="font-semibold text-[#2e2a58]">ลิงก์</strong> ในตั้งค่า — คัดลอก QR ลูกค้า ·
                      ลิงก์แผนกทำ/เสิร์ฟ · ทดสอบบนมือถือ
                    </li>
                    <li>ลองรับออเดอร์ 1 บิล · ติดตามคิว · ชำระเงิน · ตรวจยอดในการเงิน</li>
                  </ol>
                </>
              ),
            },
            {
              title: "เมนูหลัก",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ออร์เดอร์</strong> — หน้ารับออเดอร์หลักของพนักงาน
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">คิวออเดอร์</strong> — กระดานสถานะออเดอร์แบบเรียลไทม์
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">สินค้า</strong> — จัดการหมวด · เมนู · ทดลองเพิ่มในบิล
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — ยอดขาย · กราฟ · ประวัติ · รายจ่าย
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าร้าน</strong> — ข้อมูลร้าน · การเงิน · เว็บ · เวลา ·
                    แต้ม · ลิงก์ QR
                  </li>
                  <li>เดสก์ท็อป: แท็บอยู่ในส่วนหัว · กดซ่อนหัวแล้วแท็บย้ายไปแถบม่วงด้านบน</li>
                </ul>
              ),
            },
            {
              title: "ออร์เดอร์",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">คอมพิวเตอร์:</strong> ซ้าย = ค้นหาสมาชิก · รายการในบิล ·
                    ชำระเงิน · ขวา = กริดเมนู 3 คอลัมน์ขึ้นไป
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">มือถือ:</strong> กริดเมนูเต็มจอ · สรุปบิลอยู่เหนือ dock ·
                    แตะสรุปเปิดโมดัลแก้จำนวน/ลบ/ชำระ
                  </li>
                  <li>เลือกสมาชิกก่อนบันทึกถ้าต้องการสะสม/ใช้แต้ม — ระบบแสดงยอดและสิทธิ์คงเหลือ</li>
                  <li>ช่องทางชำระ: เงินสด · พร้อมเพย์ · โอน — พร้อมเพย์/โอนแนบสลิปได้ (ไม่บังคับ)</li>
                  <li>ติ๊ก «พิมพ์สลิปหลังออเดอร์» ได้ที่หน้านี้ — ระบบจำค่าที่เลือกไว้</li>
                  <li>บันทึกแล้วออเดอร์เข้าคิวออเดอร์อัตโนมัติ — ไม่ต้องคีย์ซ้ำ</li>
                </ul>
              ),
            },
            {
              title: "คิวออเดอร์",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>สถานะหลัก: รับออเดอร์ → กำลังทำ → เสร็จแล้ว (พร้อมรับ) → ส่งมอบแล้ว — แยกสีชัด</li>
                  <li>แตะการ์ดออเดอร์เพื่อขยับสถานะทีละขั้น — อัปเดตแบบเรียลไทม์ทุกจอที่เปิดคิว</li>
                  <li>เปิดจอคิวไว้ที่เคาน์เตอร์ · เปิดลิงก์แผนกทำ/เสิร์ฟบนแท็บเล็ตในครัว</li>
                  <li>ลิงก์แผนกและ QR ลูกค้า — อยู่ใน <strong className="font-semibold text-[#2e2a58]">ตั้งค่าร้าน</strong> แท็บ{" "}
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์</strong>
                  </li>
                </ul>
              ),
            },
            {
              title: "สินค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ปุ่ม <strong className="font-semibold text-[#2e2a58]">หมวดหมู่</strong> ที่หัวการ์ด — จัดการเพิ่ม/แก้/ลบหมวดในโมดัล</li>
                  <li>แถบชิปหมวดใต้หัว — กด «ทั้งหมด» หรือหมวดเพื่อกรองกริดสินค้า</li>
                  <li>กด <strong className="font-semibold text-[#2e2a58]">+ เพิ่มสินค้า</strong> — ตั้งชื่อ · ราคา · หมวด · รูป · เปิด/ปิดขาย</li>
                  <li>แตะการ์ดสินค้าเพื่อทดลองเพิ่มในบิลร่าง — มือถือสรุปอยู่เหนือ dock · คอมเป็นแผงลอยมุมขวาล่าง</li>
                  <li>ไอคอนแก้ไข/ลบที่แถวสินค้า — ใช้เมื่อต้องปรับราคาหรือถอดเมนูออกจากการขาย</li>
                </ul>
              ),
            },
            {
              title: "การเงิน",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>สรุปด้านบน: รายรับ (เขียว) · ต้นทุน/รายจ่าย (ชมพู) · กำไร — ค่าเริ่มช่วง <strong className="font-semibold text-[#2e2a58]">เดือนนี้</strong></li>
                  <li>กด <strong className="font-semibold text-[#2e2a58]">แสดงกรอง</strong> — เลือก วันนี้ / เดือนนี้ / ปีนี้ / กำหนดเอง · ค้นหาบิล</li>
                  <li>กด <strong className="font-semibold text-[#2e2a58]">แสดงกราฟ</strong> — ดูรายรับเทียบต้นทุนรายวันและยอดขายตามช่วง</li>
                  <li>แท็บ <strong className="font-semibold text-[#2e2a58]">ประวัติ / รายรับ</strong> — ทุกแถวแก้ไขและลบได้ · มีสลิปเมื่อแนบ · ราคาขวาเป็นสีเขียว</li>
                  <li>แท็บ <strong className="font-semibold text-[#2e2a58]">รายจ่าย</strong> — บันทึกต้นทุน · หมวดรายจ่าย · แนบสลิป · กรองตามหมวด</li>
                  <li>ปิดกะ: กรองช่วงวัน → ตรวจยอดสรุป → บันทึกรายจ่ายที่ค้าง → รีเฟรชก่อนส่งรายงาน</li>
                </ul>
              ),
            },
            {
              title: "ตั้งค่าร้าน",
              content: (
                <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าพื้นฐาน</strong> — ชื่อร้าน · โลโก้ · ที่อยู่ · เบอร์ติดต่อ
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเกี่ยวกับการเงิน</strong> — พร้อมเพย์ · บัญชีโอน ·
                    ขนาดสลิปพิมพ์
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเว็บไซต์</strong> — แบนเนอร์ · แกลเลอรี · LINE · แผนที่
                    (ถ้าเปิดพอร์ทัล)
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ตั้งค่าเวลาเปิดร้าน</strong> — วันและเวลาเปิด–ปิด (เวลาไทย)
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">สะสมคะแนน</strong> — กำหนดบาท→คะแนน · ของรางวัลแลก ·
                    ข้อความกฎอัปเดตตามที่ตั้ง
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์</strong> — QR/ลิงก์ลูกค้า · พนักงาน · แผนกทำ · แผนกเสิร์ฟ ·
                    ดาวน์โหลดโปสเตอร์
                  </li>
                </ol>
              ),
            },
            {
              title: "ลิงก์ลูกค้าและแผนก",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">QR ลูกค้า</strong> — ลูกค้าสแกนสั่งเอง · เลือกเมนู · ส่งออเดอร์เข้าคิวเดียวกับหน้าร้าน
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์แผนกทำ</strong> — เปิดบนแท็บเล็ตในครัว · เห็นออเดอร์ที่ต้องทำ ·
                    อัปเดตสถานะ
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ลิงก์แผนกเสิร์ฟ</strong> — ใช้เมื่ออาหาร/เครื่องดื่มพร้อมส่งมอบ
                  </li>
                  <li>คัดลอกลิงก์หรือดาวน์โหลดโปสเตอร์ QR ติดเคาน์เตอร์ · ทดสอบสแกนจากมือถือจริงก่อนเปิดร้าน</li>
                </ul>
              ),
            },
          ]}
        />

        <div
          className={cn(
            drinkPosMainPaddingBottomClass,
            appModuleShellMainScrollClass,
            onOrderPage && "lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:pb-0",
          )}
        >
          {children}
        </div>
      </div>
    </DrinkPosMobileBottomProvider>
  );
}

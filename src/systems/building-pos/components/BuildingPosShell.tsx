"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  BUILDING_POS_HEADER_COLLAPSE_EVENT,
  BUILDING_POS_ORDER_HREF,
  readBuildingPosHeaderCollapsed,
  writeBuildingPosHeaderCollapsed,
} from "@/systems/building-pos/building-pos-nav";
import { BuildingPosMobileBottomProvider } from "@/systems/building-pos/components/BuildingPosMobileBottomChrome";
import { BuildingPosPresentationGuideCard } from "@/systems/building-pos/components/BuildingPosPresentationGuideCard";
import { BuildingPosUnifiedMenuBar } from "@/systems/building-pos/components/BuildingPosUnifiedMenuBar";
import {
  buildingPosAccentBarClass,
  buildingPosModuleGlassShellClass,
  buildingPosShellMainPaddingBottomClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

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

export function BuildingPosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const onOrderPage =
    pathname === BUILDING_POS_ORDER_HREF || pathname.startsWith(`${BUILDING_POS_ORDER_HREF}/`);
  const onPresentationPage = pathname.includes("/building-pos/presentation");

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readBuildingPosHeaderCollapsed());
    sync();
    window.addEventListener(BUILDING_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BUILDING_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeBuildingPosHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <BuildingPosMobileBottomProvider>
    <div
      className={cn(
        "flex min-h-0 max-w-full flex-1 flex-col gap-3 sm:gap-4",
        onOrderPage && "lg:h-full lg:max-h-full lg:overflow-hidden lg:!gap-3",
        onPresentationPage && "!gap-0",
      )}
    >
      <header
        className={cn(
          buildingPosModuleGlassShellClass,
          "flex flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
          (headerCollapsed || onPresentationPage) && "hidden",
        )}
      >
        <div className={buildingPosAccentBarClass} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path d="M3 2v7c0 1.1.9 2 2 2h1v9c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2V11h1c1.1 0 2-.9 2-2V2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 2v5M17 2v5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">POS ร้านอาหาร</h1>
              </div>
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
          <BuildingPosUnifiedMenuBar variant="embedded" />
        </Suspense>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — POS ร้านอาหาร"
        subtitle="ภาพรวม · เมนู · วิธีสั่งออเดอร์ · การไหลของงานครัวถึงชำระเงิน"
        sections={[
          {
            title: "สไลด์นำเสนอ",
            content: <BuildingPosPresentationGuideCard />,
          },
          {
            title: "1. ภาพรวมของโมดูล",
            content: (
              <>
                <p>
                  <strong className="font-semibold text-[#2e2a58]">POS ร้านอาหาร</strong> รวมงานหน้าร้านและหลังร้านไว้ในที่เดียว
                  — จากเมนู · รับออเดอร์ · ครัวหลายแผนก · เสิร์ฟ · ชำระเงิน · ยอดขาย และการเงิน
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> — สรุปยอดวันนี้ ออเดอร์ค้าง และทางลัดสำคัญ
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ออร์เดอร์ / คิวออเดอร์</strong> — สั่งแทนลูกค้า และติดตามสถานะแบบเรียลไทม์
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">เมนู · หมวดหมู่</strong> — จัดรายการอาหาร ราคา สถานะเปิดขาย
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">QR</strong> — ลูกค้าสแกนสั่งเอง · ลิงก์พนักงาน / แผนกครัว
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">การเงิน</strong> — ยอดขาย กราฟ รายรับ–รายจ่าย และสลิป
                  </li>
                </ul>
              </>
            ),
          },
          {
            title: "2. รายละเอียดแต่ละเมนู",
            content: (
              <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>
                  <p className="font-semibold text-[#2e2a58]">แดชบอร์ด</p>
                  <p className="mt-0.5">ดูภาพรวมร้านก่อนเปิดกะ — รายรับวันนี้ จำนวนออเดอร์ และทางลัดไปรับออเดอร์ / QR</p>
                </li>
                <li>
                  <p className="font-semibold text-[#2e2a58]">ออร์เดอร์</p>
                  <p className="mt-0.5">หน้ารับออเดอร์ของพนักงาน — เลือกโต๊ะ ช่องทาง เมนู แล้วส่งเข้าครัวทันที</p>
                </li>
                <li>
                  <p className="font-semibold text-[#2e2a58]">คิวออเดอร์</p>
                  <p className="mt-0.5">กระดาน 4 ขั้น: รับออเดอร์ → ครัวกำลังทำ → กำลังเสิร์ฟ → เสร็จแล้ว อัปเดตสถานะได้ทันที</p>
                </li>
                <li>
                  <p className="font-semibold text-[#2e2a58]">เมนู / หมวดหมู่</p>
                  <p className="mt-0.5">สร้างหมวด (เช่น จานหลัก · เครื่องดื่ม) แล้วเพิ่มเมนู ราคา รูป และเปิด/ปิดขาย</p>
                </li>
                <li>
                  <p className="font-semibold text-[#2e2a58]">QR</p>
                  <p className="mt-0.5">QR ลูกค้า/โต๊ะ · ลิงก์พนักงาน · ลิงก์แผนกครัว/เสิร์ฟ สำหรับเปิดบนมือถือหรือแท็บเล็ต</p>
                </li>
                <li>
                  <p className="font-semibold text-[#2e2a58]">การเงิน (ยอดขาย · รายจ่าย)</p>
                  <p className="mt-0.5">ตรวจยอด ปิดบิล พิมพ์สลิป กรองช่วงเวลา และบันทึกรายจ่ายพร้อมหลักฐาน</p>
                </li>
              </ol>
            ),
          },
          {
            title: "3. วิธีการใช้งาน — จากเมนูถึงออเดอร์",
            content: (
              <>
                <p className="font-semibold text-[#2e2a58]">เตรียมร้านให้พร้อม</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งชื่อร้าน · โลโก้ · ช่องทางรับชำระที่โปรไฟล์/ตั้งค่า</li>
                  <li>สร้างหมวดหมู่เมนูให้ครบ</li>
                  <li>เพิ่มเมนู ราคา และเปิดสถานะขาย</li>
                </ol>
                <p className="mt-3 font-semibold text-[#2e2a58]">รับออเดอร์จากลูกค้า (พนักงาน)</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>เปิดเมนู <strong className="font-semibold text-[#2e2a58]">ออร์เดอร์</strong></li>
                  <li>เลือกโต๊ะ / ช่องทาง · เลือกเมนูใส่ตะกร้า</li>
                  <li>ยืนยัน — ระบบส่งเข้าครัวและขึ้นคิวออเดอร์อัตโนมัติ</li>
                </ol>
                <p className="mt-3 font-semibold text-[#2e2a58]">ลูกค้าสั่งเองผ่าน QR</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>เปิดแท็บ <strong className="font-semibold text-[#2e2a58]">QR</strong> → คัดลอกลิงก์หรือพิมพ์โปสเตอร์ติดโต๊ะ</li>
                  <li>ลูกค้าสแกน เลือกเมนู ส่งออเดอร์</li>
                  <li>ออเดอร์เข้าคิวเดียวกับที่พนักงานสั่ง — ไม่ต้องคีย์ซ้ำ</li>
                </ol>
              </>
            ),
          },
          {
            title: "4. การทำงานของระบบ — ครัว · เสิร์ฟ · จ่ายเงิน",
            content: (
              <>
                <p>เมื่อมีออเดอร์ใหม่ ระบบไหลงานต่อเนื่องแบบนี้:</p>
                <ol className="mt-2 list-decimal space-y-2.5 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">รับออเดอร์</strong> — เข้าคิว · แยกเมนูไปแผนกครัวที่เกี่ยวข้อง
                    (จานหลัก / ของหวาน / เครื่องดื่ม ฯลฯ)
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">แผนกครัว</strong> — เห็นออเดอร์แบบเรียลไทม์ ทำอาหารแล้วอัปเดตสถานะ
                    “กำลังทำ / พร้อมเสิร์ฟ”
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">แผนกเสิร์ฟ</strong> — รับจานจากครัว เสิร์ฟโต๊ะ แล้วขยับสถานะบนคิว
                  </li>
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">ชำระเงิน</strong> — ปิดบิลด้วยเงินสด / พร้อมเพย์ / โอน
                    พิมพ์ใบเสร็จ และบันทึกลงยอดขาย
                  </li>
                </ol>
                <p className="mt-3 rounded-xl border border-[#dcd8f0]/80 bg-white/70 px-3 py-2.5 text-[13px] leading-relaxed text-[#4d47b6]">
                  เคล็ดลับ: เปิดจอคิวออเดอร์ให้หน้าร้าน · เปิดลิงก์ครัวบนแท็บเล็ตในครัว — ทุกเครื่องอัปเดตพร้อมกัน ไม่ต้องวิ่งส่งใบ
                </p>
              </>
            ),
          },
        ]}
      />

      <div
        className={cn(
          buildingPosShellMainPaddingBottomClass,
          "flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col",
          onOrderPage && "lg:min-h-0 lg:overflow-hidden lg:pb-0",
        )}
      >
        {children}
      </div>
    </div>
    </BuildingPosMobileBottomProvider>
  );
}

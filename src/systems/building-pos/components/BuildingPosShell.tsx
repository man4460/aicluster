"use client";

import { Suspense, useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { BuildingPosMobileDock } from "@/systems/building-pos/components/BuildingPosMobileDock";
import { BuildingPosUnifiedMenuBar } from "@/systems/building-pos/components/BuildingPosUnifiedMenuBar";
import { buildingPosModuleGlassShellClass, buildingPosShellMainPaddingBottomClass } from "@/systems/building-pos/components/building-pos-ui-tokens";

export function BuildingPosShell({ children }: { children: React.ReactNode }) {
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header
        className={`${buildingPosModuleGlassShellClass} flex flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#0d9488] text-white shadow-lg shadow-indigo-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path d="M3 2v7c0 1.1.9 2 2 2h1v9c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2V11h1c1.1 0 2-.9 2-2V2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 2v5M17 2v5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">POS ร้านอาหาร</h1>
                <p className="mt-0.5 hidden max-w-2xl text-sm font-medium leading-snug text-[#66638c] sm:block">
                  เมนู ออเดอร์ QR สั่งอาหาร — ใช้บัญชีเจ้าของ
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/45 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
            aria-label="คู่มือการใช้งาน"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" />
            </svg>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>

        {/* แท็บหลักในการ์ดหัว */}
        <Suspense fallback={null}>
          <BuildingPosUnifiedMenuBar variant="embedded" />
        </Suspense>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — POS ร้านอาหาร"
        subtitle="วิธีใช้งานแบบละเอียดรายเมนู สำหรับงานหน้าร้านและหลังร้าน"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  เริ่มจาก <strong className="font-semibold text-[#2e2a58]">หมวดหมู่</strong> แล้วค่อยสร้าง{" "}
                  <strong className="font-semibold text-[#2e2a58]">เมนูอาหาร</strong> จากนั้นทดสอบ{" "}
                  <strong className="font-semibold text-[#2e2a58]">QR สั่งอาหาร</strong> และปิดการขายใน{" "}
                  <strong className="font-semibold text-[#2e2a58]">ยอดขาย</strong>
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งชื่อร้าน/โลโก้/ช่องทางรับชำระที่หน้าโปรไฟล์</li>
                  <li>สร้างหมวดหมู่เมนูให้ครบก่อนเปิดร้าน</li>
                  <li>เพิ่มเมนูและราคา พร้อมตรวจสถานะเปิดขาย</li>
                  <li>ทดสอบรับออเดอร์ 1 รายการ และปิดบิลจริง</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูภาพรวมยอดวันนี้ จำนวนออเดอร์ และสถานะออเดอร์ค้าง</li>
                <li>ใช้แท็บย่อยในหน้าแดชบอร์ดเพื่อสลับดู QR/เมนู/หมวดหมู่ได้เร็ว</li>
                <li>เหมาะสำหรับผู้จัดการที่ต้องดูภาพรวมก่อนเริ่มรอบขาย</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ยอดขาย",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูรายการขายย้อนหลัง แก้ไขข้อมูลที่จำเป็น และตรวจยอดสุทธิ</li>
                <li>ตรวจสอบการชำระเงินและพิมพ์ใบเสร็จ/สลิปจากรายการที่ต้องการ</li>
                <li>ใช้กรองช่วงเวลาเพื่อสรุปยอดรายวัน รายสัปดาห์ หรือรายเดือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: พนักงานเสิร์ฟ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>จัดการลิงก์หรือหน้าสำหรับพนักงานหน้างานให้รับออเดอร์ได้ง่าย</li>
                <li>ช่วยแยกบทบาทพนักงานกับเจ้าของร้าน ลดความผิดพลาดในการแก้ข้อมูลหลัก</li>
                <li>ทดสอบจากมือถือพนักงานก่อนใช้งานจริงในช่วงลูกค้าหนาแน่น</li>
              </ul>
            ),
          },
          {
            title: "เมนู: QR สั่งอาหาร",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้างหน้าให้ลูกค้าสแกนแล้วสั่งอาหารได้จากโต๊ะ</li>
                <li>ตรวจว่าเมนูที่ปิดขายจะไม่แสดงให้ลูกค้าเลือก</li>
                <li>ควรพิมพ์ QR และติดตามโต๊ะให้ชัดเจนเพื่อลดการสั่งผิดโต๊ะ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: เมนูอาหาร",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่ม/แก้ไขชื่อเมนู ราคา และหมวดหมู่ที่สังกัด</li>
                <li>กำหนดสถานะเปิดขายหรือปิดชั่วคราวสำหรับเมนูหมด</li>
                <li>ทบทวนราคาให้ตรงกับหน้าร้านทุกครั้งก่อนเปิดกะ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: หมวดหมู่",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้างหมวด เช่น อาหารจานหลัก เครื่องดื่ม ของหวาน</li>
                <li>จัดเรียงหมวดให้ง่ายต่อการใช้งานทั้งฝั่งพนักงานและลูกค้า</li>
                <li>ควรตั้งชื่อสั้น กระชับ และไม่ซ้ำเพื่อความเร็วในการขาย</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ต้นทุน / รายจ่าย",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกค่าใช้จ่าย เช่น วัตถุดิบ ค่าแรง ค่าแพลตฟอร์ม</li>
                <li>เทียบรายรับกับต้นทุนเพื่อดูผลกำไรจริงของร้าน</li>
                <li>แนบหลักฐานจ่ายเงินเพื่อให้ตรวจสอบย้อนหลังได้ชัดเจน</li>
              </ul>
            ),
          },
          {
            title: "ปุ่ม: รีเฟรชออเดอร์",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ใช้เมื่อสงสัยว่าหน้าจอค้างหรือข้อมูลไม่ตรงกับอุปกรณ์อื่น</li>
                <li>ดึงออเดอร์และเมนูล่าสุดจากเซิร์ฟเวอร์ทันที</li>
                <li>แนะนำให้กดหลังมีการแก้เมนูหรือรับออเดอร์ปริมาณมาก</li>
              </ul>
            ),
          },
        ]}
      />

      <div className={buildingPosShellMainPaddingBottomClass}>{children}</div>

      <BuildingPosMobileDock />
    </div>
  );
}

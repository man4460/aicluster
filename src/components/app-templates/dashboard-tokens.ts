/**
 * คลาส Tailwind มาตรฐานแดชบอร์ด — ให้การ์ด/รายการสอดคล้องกันระหว่างโมดูล
 */
import { cn } from "@/lib/cn";

/**
 * ไล่สีปุ่ม CTA แบรนด์ MAWELL — ฟ้า/น้ำเงิน → ม่วง → ชมพู (แนวนอน)
 * เทมเพลตเดียวกับปุ่ม «เติมโทเคน» / Subscribe / เปิดแผนผัง — อย่าคัดลอก hex ไปจุดอื่น
 */
export const appDashboardBrandGradientFillClass =
  "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] hover:from-[#0000a3] hover:via-[#7c3aed] hover:to-[#db2777]";

export const appDashboardBrandGradientBarClass = "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899]";

/** ปุ่ม pill เต็ม (ข้อความขาว) — ค่าเริ่มต้นของ `TokenTopupModal`; ใส่ `w-full` ตามบริบท */
export const appDashboardBrandCtaPillButtonClass = cn(
  "inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
  appDashboardBrandGradientFillClass,
);
export const appDashboardSectionSlateClass =
  "space-y-4 sm:space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

/** โทนม่วง MAWELL (POS / แบรนด์) — ใช้คู่กับคลาส global `app-surface` */
export const appDashboardSectionVioletClass =
  "app-surface rounded-2xl border border-[#e8e6fc]/80 p-4 shadow-sm sm:p-5";

/** เปลือกรายการประวัติแบบเลื่อน (รายรับ–รายจ่าย / POS ประวัติ) */
export const appDashboardHistoryListShellClass =
  "rounded-xl border border-slate-200 bg-slate-50/40 p-2 shadow-sm sm:bg-white sm:p-3";

/** พื้นที่เนื้อหาใต้หัวโมดูล — ไม่ใส่ overflow-y/overscroll ที่นี่ (เลื่อนทั้งหน้า) กันล้อเมาส์ติดกลางหน้า */
export const appModuleShellMainScrollClass = "min-h-0 w-full flex-1";

/** เลื่อนรายการภายในการ์ด — ใช้ scrollbar-gutter ได้เฉพาะชั้นใน */
export const appDashboardInnerScrollClass =
  "overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]";

/** ปุ่มขอบเขตรอง (แถวพิมพ์ขนาดกระดาษ ฯลฯ) — สูงใกล้เคียงปุ่มโมดูล h-9 */
export const appTemplateOutlineButtonClass =
  "box-border inline-flex h-9 min-h-9 max-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold leading-none text-slate-800 shadow-sm hover:bg-slate-50 touch-manipulation";

/** ปุ่มเลือกรูปจากแกลเลอรี (ม่วง POS / สลิป) — คู่กับ `appTemplateTakePhotoButtonClass` */
export const appTemplatePickGalleryImageButtonClass =
  "box-border inline-flex h-9 min-h-9 max-h-9 items-center justify-center rounded-lg border border-[#4d47b6]/35 bg-[#ecebff] px-2.5 text-[11px] font-semibold leading-none text-[#4d47b6] touch-manipulation disabled:opacity-50 sm:text-xs";

/** ปุ่มถ่ายรูป / เปิดกล้อง (เขียว) */
export const appTemplateTakePhotoButtonClass =
  "box-border inline-flex h-9 min-h-9 max-h-9 items-center justify-center rounded-lg border border-emerald-600/40 bg-emerald-50 px-2.5 text-[11px] font-semibold leading-none text-emerald-900 touch-manipulation disabled:opacity-50 sm:text-xs";

import { cn } from "@/lib/cn";
import { appSafeAreaBottomPadClass } from "@/components/app-templates/safe-area-tokens";

/**
 * แถบเมนูล่างมือถือ / ไอแพดแนวตั้ง — ชั้นเดียวเต็มขอบ
 * (ไม่ซ้อนกล่อง pill ด้านใน — active ใช้สีไอคอน/ตัวอักษร)
 */
export const appMobileDockBackdropClass = cn(
  "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 px-2 pt-1 shadow-[0_-8px_28px_-18px_rgba(30,27,75,0.18)] backdrop-blur-xl lg:hidden print:hidden",
  appSafeAreaBottomPadClass,
);

/**
 * โซนรายการเมนูภายในแถบ — ไม่มีขอบ/เงา/พื้นแยก (กันกล่องซ้อน)
 * `pillClassName` จากโมดูลยังส่งได้แต่ควรเป็น layout เท่านั้น
 */
export const appMobileDockPillClass = "mx-auto w-full max-w-6xl";

/** โซนเนื้อหาเสริมเหนือเมนู (เช่น สรุปบิลรอบันทึก) — การ์ดเบาได้เพราะไม่ใช่ชั้นเมนูซ้ำ */
export const appMobileDockUnifiedSlotClass =
  "mx-auto mb-1.5 w-full max-w-6xl rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2 shadow-sm";

export const appMobileDockGridClass = "grid gap-0.5";

/** เว้นที่เลื่อนเนื้อหาเหนือแถบ dock มือถือ / ไอแพดแนวตั้ง */
export const appMobileDockContentClearanceClass = "pb-24 lg:pb-0";

/** เลือกแล้ว — เน้นสีไอคอน/ข้อความ ไม่ใส่พื้นกล่อง */
export const appMobileDockItemActiveClass = "font-bold text-[#5b61ff]";

export const appMobileDockItemIdleClass = "font-semibold text-slate-500 hover:text-slate-700";

export function appMobileDockLinkClass(active: boolean) {
  return cn(
    "flex min-h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-center transition-colors active:scale-[0.96]",
    active ? appMobileDockItemActiveClass : appMobileDockItemIdleClass,
  );
}

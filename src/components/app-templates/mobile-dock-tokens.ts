import { cn } from "@/lib/cn";

/** แถบพื้นขาวเต็มความกว้างชิดขอบซ้ายขวา — รองรับ safe area (มือถือ / ไอแพดแนวตั้ง) */
export const appMobileDockBackdropClass =
  "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/75 bg-gradient-to-b from-white/98 via-white/95 to-slate-50/92 px-3 pb-[max(calc(env(safe-area-inset-bottom,0px)+0.5rem),0.65rem)] pt-2 shadow-[0_-14px_44px_-20px_rgba(30,27,75,0.24)] backdrop-blur-2xl lg:hidden print:hidden";

/** กล่องเมนูโค้งมนภายในแถบล่าง */
export const appMobileDockPillClass =
  "mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/75 bg-white/88 p-1.5 shadow-[0_16px_42px_-22px_rgba(91,97,255,0.38)] ring-1 ring-inset ring-white/85 backdrop-blur-xl";

/** โซนเนื้อหาเสริมเหนือเมนู (เช่น สรุปบิลรอบันทึก) */
export const appMobileDockUnifiedSlotClass =
  "mx-auto mb-2 w-full max-w-6xl rounded-[1.35rem] border border-white/70 bg-white/75 px-3 py-2 shadow-sm ring-1 ring-inset ring-white/60 backdrop-blur-md";

export const appMobileDockGridClass = "grid gap-1.5";

/** เว้นที่เลื่อนเนื้อหาเหนือแถบ dock มือถือ / ไอแพดแนวตั้ง */
export const appMobileDockContentClearanceClass = "pb-24 lg:pb-0";

export const appMobileDockItemActiveClass =
  "bg-white/90 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const appMobileDockItemIdleClass = "text-slate-500 hover:bg-white/55 hover:text-slate-700";

export function appMobileDockLinkClass(active: boolean) {
  return cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? appMobileDockItemActiveClass : appMobileDockItemIdleClass,
  );
}

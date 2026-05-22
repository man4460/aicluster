/**
 * โทน UI ร้านออนไลน์ — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

export const ecommerceCardSurfaceRadiusClass = "rounded-[2rem]";
export const ecommerceCardLargeRadiusClass = "rounded-[2.5rem]";
export const ecommerceInsetControlRadiusClass = "rounded-[1.25rem]";

/** เปลือกหัวโมดูล — glass แบบคาร์แคร์ */
export const ecommerceModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const ecommerceNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

export const ecommerceNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const ecommerceNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

/** Dock มือถือ */
export const ecommerceMobileDockShellClass =
  "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30 shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const ecommerceDockItemActiveClass =
  "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const ecommerceDockItemIdleClass = "text-slate-500 hover:bg-white/45 hover:text-slate-700";

/** ชิป / แท็บกรอง */
export function ecommerceFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

/** การ์ดแถวรายการ */
export const ecommerceListRowCardClass =
  `${ecommerceCardSurfaceRadiusClass} border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)]`;

export const ecommerceListRowCardWarnClass =
  `${ecommerceCardSurfaceRadiusClass} border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-4 shadow-sm ring-1 ring-amber-200/60`;

/** แผงย่อยในตั้งค่า */
export const ecommerceSettingsPanelClass =
  `${ecommerceCardSurfaceRadiusClass} border border-white/55 bg-white/40 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl sm:p-5`;

/** กล่องสถิติรวม (ห่อกริด) */
export const ecommerceStatsPanelClass =
  `${ecommerceCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

/** การ์ดรายรับหลัก */
export const ecommerceHeroRevenueCardClass =
  `col-span-2 ${ecommerceInsetControlRadiusClass} border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 px-4 py-4 text-indigo-900 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl sm:col-span-1`;

export const ecommerceIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export const ecommerceGuideButtonClass =
  "flex min-h-[40px] shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95";

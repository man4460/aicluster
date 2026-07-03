/**
 * โทน UI รายรับ–รายจ่าย — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

export const hfCardSurfaceRadiusClass = "rounded-[2rem]";
export const hfCardLargeRadiusClass = "rounded-[2.5rem]";
export const hfInsetControlRadiusClass = "rounded-[1.25rem]";

export const hfModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const hfNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

export const hfNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const hfNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

export {
  appMobileDockBackdropClass as hfMobileDockShellClass,
  appMobileDockPillClass as hfMobileDockPillClass,
  appMobileDockGridClass as hfMobileDockGridClass,
  appMobileDockItemActiveClass as hfDockItemActiveClass,
  appMobileDockItemIdleClass as hfDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

export const hfIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export const hfGuideButtonClass =
  "flex min-h-[40px] shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95";

export function hfFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

/** การ์ดหน้าหลัก (หมวด / บิล / รถ) */
export const hfSectionClass =
  `space-y-5 ${hfCardLargeRadiusClass} border border-white/55 bg-white/28 p-5 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl`;

export const hfSectionTightClass =
  `space-y-4 ${hfCardLargeRadiusClass} border border-white/55 bg-white/28 p-5 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl`;

export const hfListRowCardClass =
  `${hfCardSurfaceRadiusClass} border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70`;

export const hfPanelGlassClass =
  `${hfCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

export const hfHeroCtaClass =
  `${hfCardSurfaceRadiusClass} border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/30 to-violet-100/25 p-4 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.35)] backdrop-blur-xl sm:p-5`;

export const hfFilterCardClass =
  `${hfCardSurfaceRadiusClass} border border-white/55 bg-white/50 p-4 shadow-sm backdrop-blur-sm`;

export const hfStatsPanelClass =
  `${hfCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

export const hfManageSubNavShellClass =
  `${hfCardSurfaceRadiusClass} border border-white/55 bg-white/40 p-3 backdrop-blur-md sm:p-4`;

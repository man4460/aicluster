/**
 * โทน UI ทะเบียนคุมสื่อ — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

export const mrCardSurfaceRadiusClass = "rounded-[2rem]";
export const mrCardLargeRadiusClass = "rounded-[2.5rem]";
export const mrInsetControlRadiusClass = "rounded-[1.25rem]";

export const mrModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const mrNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2";

export const mrNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const mrNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

export {
  appMobileDockBackdropClass as mrMobileDockShellClass,
  appMobileDockPillClass as mrMobileDockPillClass,
  appMobileDockGridClass as mrMobileDockGridClass,
  appMobileDockItemActiveClass as mrDockItemActiveClass,
  appMobileDockItemIdleClass as mrDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

export const mrIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export function mrFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

export const mrListRowCardClass =
  `${mrCardSurfaceRadiusClass} border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)]`;

export const mrListRowCardCompactClass =
  `${mrInsetControlRadiusClass} border border-white/60 bg-white/55 px-3 py-2.5 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:bg-white/70`;

export const mrStatsPanelClass =
  `${mrCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

export const mrSegmentShellClass =
  `${mrCardSurfaceRadiusClass} flex gap-1 border border-white/55 bg-white/40 p-1 backdrop-blur-md`;

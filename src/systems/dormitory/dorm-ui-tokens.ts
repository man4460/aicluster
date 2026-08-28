/**
 * โทน UI จัดการหอพัก — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

export const dormCardSurfaceRadiusClass = "rounded-[2rem]";
export const dormCardLargeRadiusClass = "rounded-[2.5rem]";
export const dormInsetControlRadiusClass = "rounded-[1.25rem]";

export const dormModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const dormNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-1.5 rounded-2xl px-3 text-sm font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

export const dormNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const dormNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

export {
  appMobileDockBackdropClass as dormMobileDockShellClass,
  appMobileDockPillClass as dormMobileDockPillClass,
  appMobileDockGridClass as dormMobileDockGridClass,
  appMobileDockItemActiveClass as dormDockItemActiveClass,
  appMobileDockItemIdleClass as dormDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

export const dormIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export function dormFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

export const dormListRowCardClass =
  `${dormCardSurfaceRadiusClass} border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)]`;

export const dormListRowCardCompactClass =
  `${dormInsetControlRadiusClass} border border-white/60 bg-white/55 px-3 py-2.5 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:bg-white/70`;

export const dormListRowCardWarnClass =
  `${dormCardSurfaceRadiusClass} border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white/70 p-3 shadow-sm ring-1 ring-amber-100/70 backdrop-blur-sm`;

export const dormPanelCardClass =
  `${dormCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

export const dormSegmentShellClass =
  `${dormCardSurfaceRadiusClass} flex gap-1 border border-white/55 bg-white/40 p-1 backdrop-blur-md`;

export const dormFinanceSubTabShellClass =
  "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export const dormFinanceStatsGridClass = "grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";

export const dormFinanceStatTailClass = "col-span-2 sm:col-span-1";

export const dormFieldClass =
  "mt-1 min-h-[44px] w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[#1e1b4b] outline-none ring-1 ring-inset ring-white/50 focus:border-[#5b61ff]/45 focus:ring-2 focus:ring-[#5b61ff]/20 sm:min-h-[40px]";

export const dormEmptyDashedClass =
  `${dormInsetControlRadiusClass} border border-dashed border-white/60 bg-white/35 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c] backdrop-blur-sm`;

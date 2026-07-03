/**
 * โทน UI สารบรรณดิจิทัล — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

import { cn } from "@/lib/cn";

export const docCardSurfaceRadiusClass = "rounded-[2rem]";
export const docCardLargeRadiusClass = "rounded-[2.5rem]";
export const docInsetControlRadiusClass = "rounded-[1.25rem]";

export const docModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const docNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2";

export const docNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const docNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

export {
  appMobileDockBackdropClass as docMobileDockShellClass,
  appMobileDockPillClass as docMobileDockPillClass,
  appMobileDockGridClass as docMobileDockGridClass,
  appMobileDockItemActiveClass as docDockItemActiveClass,
  appMobileDockItemIdleClass as docDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

export const docIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export function docFilterChipClass(active: boolean) {
  return active
    ? "min-h-[42px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-xs font-bold text-white shadow-sm sm:text-sm"
    : "min-h-[42px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-xs font-semibold text-[#4d47b6] transition hover:bg-white/90 sm:text-sm";
}

export const docSegmentShellClass =
  `${docCardSurfaceRadiusClass} border border-white/55 bg-white/40 p-1.5 backdrop-blur-md sm:p-2`;

export const docListRowCardClass =
  `${docCardSurfaceRadiusClass} border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] sm:p-4`;

export const docListRowCardWarnClass =
  `${docCardSurfaceRadiusClass} border border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-white/70 p-3 shadow-sm ring-1 ring-rose-100/70 backdrop-blur-sm sm:p-4`;

export const docEmptyDashedClass =
  `${docInsetControlRadiusClass} border border-dashed border-white/60 bg-white/35 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c] backdrop-blur-sm`;

export const docFieldClass =
  "min-h-[40px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

export function docStatCardClass(tone: "violet" | "slate" | "amber" | "emerald" | "rose" | "indigo") {
  const toneStyles = {
    indigo:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
    violet:
      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
    slate:
      "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)]",
    emerald:
      "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",
    amber:
      "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",
    rose: "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)]",
  };
  return cn(
    "relative overflow-hidden rounded-[2rem] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-5",
    toneStyles[tone],
  );
}

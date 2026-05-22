/**
 * โทน UI รับฝากจอดรถ — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

import { cn } from "@/lib/cn";

export const parkingCardSurfaceRadiusClass = "rounded-[2rem]";
export const parkingCardLargeRadiusClass = "rounded-[2.5rem]";
export const parkingInsetControlRadiusClass = "rounded-[1.25rem]";

export const parkingModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6 print:hidden";

export const parkingNavItemBase =
  "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-2 py-3 text-sm font-black transition-all active:scale-[0.98]";

export const parkingNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const parkingNavItemIdleClass = "text-slate-500 hover:bg-white/45 hover:text-[#4d47b6]";

export const parkingMobileDockShellClass =
  "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30 shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const parkingDockItemActiveClass =
  "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const parkingDockItemIdleClass = "text-slate-500 hover:bg-white/45 hover:text-slate-700";

export const parkingIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export const parkingPanelCardClass =
  `${parkingCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

export const parkingValetInnerCardClass =
  `${parkingCardSurfaceRadiusClass} border border-white/60 bg-white/45 p-4 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/55 sm:p-5`;

export const parkingListRowCardClass =
  `${parkingCardSurfaceRadiusClass} group/item relative flex min-h-0 flex-col gap-2 overflow-hidden border border-white/60 bg-white/55 px-3 py-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] sm:gap-3 sm:px-4 sm:py-4`;

export const parkingListScrollShellClass =
  "max-h-[min(78vh,52rem)] overflow-y-auto overscroll-y-contain rounded-[2rem] border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] md:border-0 md:bg-transparent md:shadow-none md:backdrop-blur-none md:max-h-none md:overflow-visible";

export const parkingListRowAccentClass =
  "absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#5b61ff]/90 via-[#8d64ff]/70 to-[#5b61ff]/50 opacity-90 transition-all group-hover/item:w-1.5";

export function parkingFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

export function parkingStatCardClass(tone: "indigo" | "slate" | "emerald" | "amber" | "violet") {
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
  };
  return cn(
    "relative overflow-hidden rounded-[2rem] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-5",
    toneStyles[tone],
  );
}

/**
 * โทน UI EduCare เช็คนักเรียน — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

import { cn } from "@/lib/cn";

export const educareCardSurfaceRadiusClass = "rounded-[2rem]";
export const educareCardLargeRadiusClass = "rounded-[2.5rem]";
export const educareInsetControlRadiusClass = "rounded-[1.25rem]";

export const educareModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const educareNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2";

export const educareNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const educareNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

export const educareMobileDockShellClass =
  "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30 shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const educareDockItemActiveClass =
  "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const educareDockItemIdleClass = "text-slate-500 hover:bg-white/45 hover:text-slate-700";

export const educareIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export function educareFilterChipClass(active: boolean) {
  return active
    ? "min-h-[42px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-xs font-bold text-white shadow-sm sm:text-sm"
    : "min-h-[42px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-xs font-semibold text-[#4d47b6] transition hover:bg-white/90 sm:text-sm";
}

export const educareSegmentShellClass =
  `${educareCardSurfaceRadiusClass} border border-white/55 bg-white/40 p-1.5 backdrop-blur-md sm:p-2`;

export const educareListRowCardClass =
  `${educareCardSurfaceRadiusClass} border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] sm:p-4`;

export const educareEmptyDashedClass =
  `${educareInsetControlRadiusClass} border border-dashed border-white/60 bg-white/35 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c] backdrop-blur-sm`;

export const educareFieldClass =
  "min-h-[40px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] placeholder:text-[#a3a0c0] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

export const educareFieldCompactClass =
  "w-full rounded-xl border border-white/60 bg-white/70 px-2.5 py-2 text-xs text-[#2e2a58] placeholder:text-[#a3a0c0] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

export const educareLabelClass =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b61ff]/80";

export const educarePrimaryButtonClass =
  "min-h-[44px] rounded-[2rem] bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] px-5 text-sm font-bold text-white shadow-[0_18px_30px_-15px_rgba(91,97,255,0.85)] transition active:scale-[0.99] disabled:opacity-50";

export const educareAvatarFallbackClass =
  "grid place-items-center rounded-full bg-gradient-to-br from-[#5b61ff]/15 to-[#6a63ff]/10 font-bold text-[#5b61ff] ring-2 ring-white";

export function educareStatCardClass(tone: "violet" | "slate" | "amber" | "emerald" | "rose" | "indigo") {
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

/**

 * โทน UI จองคิวอัจฉริยะ — สอดคล้องคาร์แคร์

 */



import { cn } from "@/lib/cn";



export const aqCardSurfaceRadiusClass = "rounded-[2rem]";
export const aqCardLargeRadiusClass = "rounded-[2.5rem]";
export const aqCardBodyPaddingXClass = "px-2.5 sm:px-4";
export const aqPageStackClass = "min-w-0 space-y-5";
export const aqSectionFirstClass = "min-w-0 space-y-4";
export const aqSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-5";
export const aqIconToolbarGroupClass =
  "flex items-center gap-0.5 rounded-[2rem] border border-[#e8e6f4] bg-[#f8f7ff] p-0.5 md:rounded-[1.25rem]";
export const aqQrHubPanelClass =
  `min-w-0 overflow-hidden ${aqCardLargeRadiusClass} border border-white/45 bg-gradient-to-br from-white/48 via-white/32 to-indigo-50/[0.12] p-5 shadow-[0_18px_44px_-30px_rgba(30,27,75,0.28)] backdrop-blur-md sm:p-7 md:p-8`;
export const aqQrHubPreviewImgClass =
  "relative z-[1] mx-auto h-auto w-full max-w-[300px] rounded-[1.25rem] shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)] sm:max-w-[340px] sm:rounded-[2rem]";
export const aqQrHubToolbarClass =
  `${aqCardSurfaceRadiusClass} flex flex-wrap gap-2 border border-white/45 bg-white/30 p-2.5 backdrop-blur-sm`;
export const aqStatCardFlatClass =
  `flex min-h-[100px] flex-col justify-center ${aqCardSurfaceRadiusClass} border border-[#e8e6f4]/80 bg-white p-4 shadow-sm`;
export const aqEmptyStateDashedClass =
  `${aqCardSurfaceRadiusClass} border border-dashed border-[#dcd8f0] bg-[#faf9ff]/80 ${aqCardBodyPaddingXClass} py-10`;
export const aqInlineAlertErrorClass =
  `${aqCardSurfaceRadiusClass} border border-red-200/80 bg-red-50/90 ${aqCardBodyPaddingXClass} py-3 text-sm text-red-800`;

export const aqModuleHeaderShellClass =

  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";



export const aqNavItemBase =

  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2";



export const aqNavItemActiveClass =

  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";



export const aqNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";



export const aqMobileDockShellClass =

  "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30 shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";



export const aqDockItemActiveClass =

  "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";



export const aqDockItemIdleClass = "text-slate-500 hover:bg-white/45 hover:text-slate-700";



export const aqIconBadgeClass =

  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";



export function aqFilterChipClass(active: boolean) {

  return active

    ? "min-h-[42px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-xs font-bold text-white shadow-sm sm:text-sm"

    : "min-h-[42px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-xs font-semibold text-[#4d47b6] transition hover:bg-white/90 sm:text-sm";

}



export const aqSegmentShellClass =

  `${aqCardSurfaceRadiusClass} border border-white/55 bg-white/40 p-1.5 backdrop-blur-md sm:p-2`;



export const aqListRowCardClass =

  `${aqCardSurfaceRadiusClass} border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 sm:p-4`;



export const aqFieldClass =

  "min-h-[40px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";



export const aqKanbanColumnClass =

  "flex min-h-[280px] flex-col rounded-[2rem] border border-white/55 bg-white/35 p-2 backdrop-blur-md sm:min-h-[360px] sm:p-3";



export const aqKanbanCardClass =

  "cursor-grab rounded-[1.25rem] border border-white/60 bg-white/80 p-3 shadow-sm ring-1 ring-white/50 active:cursor-grabbing";



export function aqStatCardClass(tone: "violet" | "emerald" | "amber" | "indigo" | "rose") {

  const toneStyles = {

    violet:

      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",

    indigo:

      "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",

    emerald:

      "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",

    amber:

      "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",

    rose: "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)]",

  };

  return cn(

    "relative overflow-hidden rounded-[2rem] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:p-5",

    toneStyles[tone],

  );

}



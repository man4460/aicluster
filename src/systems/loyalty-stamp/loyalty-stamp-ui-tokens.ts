import { cn } from "@/lib/cn";

export const lsCardSurfaceRadiusClass = "rounded-[2rem]";
export const lsCardLargeRadiusClass = "rounded-[2.5rem]";
export const lsPageStackClass = "min-w-0 space-y-5";
export const lsSectionFirstClass = "min-w-0 space-y-4";
export const lsSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-5";

export const lsQrHubPanelClass =
  `min-w-0 overflow-hidden ${lsCardLargeRadiusClass} border border-white/45 bg-gradient-to-br from-white/48 via-white/32 to-indigo-50/[0.12] p-5 shadow-[0_18px_44px_-30px_rgba(30,27,75,0.28)] backdrop-blur-md sm:p-7`;
export const lsQrHubPreviewImgClass =
  "relative z-[1] mx-auto h-auto w-full max-w-[300px] rounded-[1.25rem] shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)] sm:max-w-[340px] sm:rounded-[2rem]";
export const lsQrHubToolbarClass =
  `${lsCardSurfaceRadiusClass} mt-4 flex flex-wrap gap-2 border border-white/45 bg-white/30 p-2.5 backdrop-blur-sm`;

export const lsModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const lsListRowCardClass =
  `${lsCardSurfaceRadiusClass} border border-white/60 bg-white/55 p-3 text-left shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 sm:p-4`;

export const lsFieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-left text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

export const lsStampCardClass =
  `${lsCardLargeRadiusClass} border border-white/55 bg-gradient-to-br from-white/70 via-indigo-50/40 to-violet-100/25 p-5 shadow-[0_20px_50px_-28px_rgba(79,70,229,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/60 sm:p-6`;

export function lsStatCardClass(tone: "violet" | "emerald" | "amber" | "indigo" | "rose") {
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
    "relative overflow-hidden rounded-[2rem] border p-4 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:p-5",
    toneStyles[tone],
  );
}

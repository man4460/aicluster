import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

export const proResumeBtnRadiusClass = "rounded-lg";
export const proResumeBtnHeightClass = "box-border h-9 min-h-9 max-h-9";
export const proResumeBtnPadXClass = "px-2.5";
export const proResumeBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  proResumeBtnRadiusClass,
  proResumeBtnHeightClass,
  "text-[11px] font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs",
);

export const proResumeOutlineButtonClass = cn(
  proResumeBtnBaseClass,
  proResumeBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const proResumePrimaryButtonClass = cn(
  proResumeBtnBaseClass,
  proResumeBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const proResumeIconButtonClass = cn(
  proResumeBtnBaseClass,
  "w-9 min-w-9 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const proResumeRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

export const proResumeFieldClass = cn(
  "app-input box-border w-full",
  proResumeBtnHeightClass,
  proResumeBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const proResumeTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  proResumeBtnRadiusClass,
);

export const proResumePanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const proResumePanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const proResumePanelDividerClass = "border-t border-slate-200/80";

export const proResumeSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

export const proResumeSubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

export const proResumePageStackClass = "min-w-0 space-y-4";

export const proResumePrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function proResumePrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-8 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-md px-2.5 text-xs font-bold leading-none sm:min-h-9 sm:grow-0 sm:basis-auto sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

export const proResumeFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function proResumeFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

export const proResumeStatsGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

export const proResumeStatTailClass = "col-span-2 sm:col-span-1";

export const proResumeStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const proResumeRowCardClass =
  "flex flex-col gap-3 rounded-lg border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4";

export const proResumeGlassShellClass =
  "rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/40 shadow-[0_8px_32px_rgba(30,27,75,0.06)] backdrop-blur-2xl sm:rounded-[2.5rem]";

export const proResumePortalPrimaryBtnClass = proResumePrimaryButtonClass;
export const proResumePortalFieldClass = proResumeFieldClass;

export const proResumePortalShopNameClass =
  "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] bg-clip-text font-black tracking-tight text-transparent";

export const proResumePortalShopNameHeroClass = cn(
  proResumePortalShopNameClass,
  "drop-shadow-[0_1px_8px_rgba(255,255,255,0.55)]",
);

export const proResumePortalSectionDividerClass = "border-t border-slate-200/80";

export const proResumePortalPageTitleClass =
  "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

export const proResumePortalPageSubtitleClass = "text-sm font-semibold text-[#66638c]";

export const proResumePortalPageBodyClass = cn(
  proResumePortalSectionDividerClass,
  "mt-4 space-y-4 pt-5",
);

export const proResumePortalEventCardGridClass =
  "grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-3";

export const proResumeMainPaddingBottomClass = "max-lg:pb-24 lg:pb-0";

export const proResumeDisabledButtonClass = cn(
  proResumeOutlineButtonClass,
  "cursor-not-allowed opacity-50 hover:border-slate-200/90 hover:bg-white",
);

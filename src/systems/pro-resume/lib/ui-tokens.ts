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
  "inline-flex w-full max-w-full flex-nowrap items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function proResumePrimaryTabPillClass(active: boolean): string {
  return cn(
    "inline-flex min-h-9 min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-bold leading-none sm:min-h-10 sm:px-3 sm:text-sm",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

/** เปลือกแถบเมนูมือถือ+ไอแพดแนวตั้ง — ชิดล่างสุด · พื้นขาวเต็ม รวม safe area */
export const proResumePortalTabDockMobileShellClass = cn(
  "fixed inset-x-0 bottom-0 z-40 bg-white lg:hidden",
  "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
  "after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-32 after:bg-white",
);

export const proResumePortalTabDockMobileInnerClass = cn(
  "flex w-full flex-nowrap items-center gap-1 border-t border-slate-200/90 bg-white px-3 pt-2 pb-2",
  "shadow-[0_-6px_20px_rgba(30,27,75,0.06)]",
);

/** แถบเมนูบนเดสก์ท็อป (lg+) — ห่อด้วย wrap ที่ซ่อนเมื่อมีแถบล่าง */
export const proResumePortalTabDockDesktopWrapClass = "hidden lg:block";

export const proResumePortalTabDockDesktopClass = cn(proResumePrimaryTabShellClass, "w-full");

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

/** กริดผลงานสาธารณะ — มือถือ 2 · ไอแพดแนวตั้ง 3 · คอม 4 */
export const proResumePortalPortfolioGridClass =
  "grid list-none grid-cols-2 gap-2 p-0 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-4";

/** 2 แถวต่อหน้า */
export const PRO_RESUME_PORTAL_PORTFOLIO_ROWS = 2;
export const PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_MOBILE = 2 * PRO_RESUME_PORTAL_PORTFOLIO_ROWS;
export const PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_TABLET = 3 * PRO_RESUME_PORTAL_PORTFOLIO_ROWS;
export const PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_DESKTOP = 4 * PRO_RESUME_PORTAL_PORTFOLIO_ROWS;

export const proResumeStatsGridClass = "grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-1";

export const proResumeStatTailClass = "col-span-2 sm:col-span-1 lg:col-span-1";

export const proResumeStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

/** แดชบอร์ด — สรุปซ้าย · กราฟขวาเต็มพื้นที่ (คอม) ไม่ห่อกล่อง */
export const proResumeDashboardOverviewGridClass =
  "grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(10rem,13.5rem)_minmax(0,1fr)] lg:items-start lg:gap-5";
export const proResumeRowCardClass =
  "flex flex-col gap-3 rounded-lg border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4";

export const proResumeGlassShellClass =
  "rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/40 shadow-[0_8px_32px_rgba(30,27,75,0.06)] backdrop-blur-2xl sm:rounded-[2.5rem]";

export const proResumePortalPrimaryBtnClass = proResumePrimaryButtonClass;
export const proResumePortalFieldClass = proResumeFieldClass;

/** ความกว้างหน้าสาธารณะ — กว้างขึ้นบนเดสก์ท็อป */
export const proResumePortalContainerClass = "mx-auto w-full max-w-6xl";

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

/** เนื้อหารายละเอียดสาธารณะ — หัวข้อใหญ่ · ย่อหน้า · บูลเล็ต · ตัวหนา */
export const proResumePortalRichContentClass = cn(
  "max-w-none text-[#1e1b4b]",
  "[&_h1]:mb-2 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:text-[#1e1b4b] [&_h1]:first:mt-0 sm:[&_h1]:text-2xl",
  "[&_h2]:mb-1.5 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-[#1e1b4b] [&_h2]:first:mt-0 sm:[&_h2]:text-lg",
  "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[#4d47b6] [&_h3]:first:mt-0 sm:[&_h3]:text-base",
  "[&_p]:mt-2 [&_p]:text-sm [&_p]:font-medium [&_p]:leading-relaxed [&_p]:text-[#5f5a8a] [&_p]:first:mt-0 sm:[&_p]:text-[0.9375rem]",
  "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-[#5b61ff]",
  "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:marker:font-bold [&_ol]:marker:text-[#5b61ff]",
  "[&_li]:text-sm [&_li]:font-medium [&_li]:leading-relaxed [&_li]:text-[#5f5a8a] sm:[&_li]:text-[0.9375rem]",
  "[&_strong]:font-bold [&_strong]:text-[#1e1b4b]",
  "[&_em]:italic",
);

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

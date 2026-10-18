import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/**
 * ปุ่ม / การ์ด / แท็บ Smart Police — compact (h-8 · rounded-md)
 * หมายเหตุ: `cn` ในโปรเจกต์นี้ไม่ใช้ twMerge — ห้ามซ้อนคลาสชนกัน
 */
export const smartPoliceBtnRadiusClass = "rounded-md";
export const smartPoliceBtnHeightClass = "box-border h-8 min-h-8 max-h-8";
export const smartPoliceBtnPadXClass = "px-2";

export const smartPoliceBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1",
  smartPoliceBtnRadiusClass,
  smartPoliceBtnHeightClass,
  "text-[11px] font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50",
);

export const smartPoliceOutlineButtonClass = cn(
  smartPoliceBtnBaseClass,
  smartPoliceBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const smartPolicePrimaryButtonClass = cn(
  smartPoliceBtnBaseClass,
  smartPoliceBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const smartPoliceIconButtonClass = cn(
  smartPoliceBtnBaseClass,
  "w-8 min-w-8 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const smartPolicePrimaryIconButtonClass = cn(
  smartPoliceBtnBaseClass,
  "w-8 min-w-8 border border-transparent px-0 text-white",
  appDashboardBrandGradientFillClass,
);

/** แถวหัวการ์ด — ชื่อซ้าย · ปุ่มขวา (ห่อเมื่อแคบ) */
export const smartPoliceCardHeaderRowClass =
  "flex flex-wrap items-center justify-between gap-2 gap-y-1.5";

/** กลุ่มปุ่มแอ็กชันหัวการ์ด — กะทัดรัดในกล่องเดียวกัน */
export const smartPoliceHeaderActionShellClass =
  "inline-flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5 sm:flex-nowrap";

/** แถวเครื่องมือในเนื้อหา (เช่น เอกสาร) */
export const smartPoliceToolbarRowClass =
  "flex flex-wrap items-center gap-1";

export const smartPoliceCardTitleClass =
  "text-sm font-black tracking-tight text-[#1e1b4b] sm:text-[15px]";

export const smartPoliceCardMetaClass =
  "mt-0.5 text-[11px] font-medium leading-snug text-[#66638c]";

export const smartPoliceRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

export const smartPoliceRowRemoveIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 shadow-sm touch-manipulation transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50",
);

export const smartPoliceFieldClass = cn(
  "app-input box-border w-full",
  smartPoliceBtnHeightClass,
  smartPoliceBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const smartPoliceTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  smartPoliceBtnRadiusClass,
);

export const smartPoliceLabelClass = "block text-xs font-bold text-[#4d47b6]";

export const smartPolicePanelClass =
  "w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const smartPolicePanelSectionClass = "px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5";

export const smartPolicePanelDividerClass = "border-t border-slate-200/80";

export const smartPoliceSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

export const smartPoliceSubtitleClass =
  "mt-0.5 text-[11px] font-medium leading-snug text-[#66638c]";

/** เนื้อหาทุกหน้า — กว้างเต็มคอลัมน์ขวา */
export const smartPolicePageStackClass = "flex min-h-0 w-full min-w-0 flex-1 flex-col space-y-3";

/** แผงหลักยืดเต็มความกว้าง */
export const smartPoliceContentBleedClass = "w-full min-w-0 max-w-none";

export const smartPoliceMutedTextClass = "text-sm font-medium text-[#66638c]";

export const smartPolicePrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-0.5 rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5";

export function smartPolicePrimaryTabPillClass(active: boolean): string {
  return cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2.5 text-[11px] font-bold leading-none sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

export const smartPoliceMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  smartPoliceBtnHeightClass,
  smartPoliceBtnRadiusClass,
);

export const smartPoliceFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function smartPoliceFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

/** กรองแบบข้อความคลิก · ไม่ใช่ปุ่มชิป */
export function smartPoliceFilterTextClass(active = false): string {
  return cn(
    "shrink-0 whitespace-nowrap text-[11px] font-semibold leading-none transition underline-offset-2",
    active
      ? "font-bold text-[#4d47b6] underline"
      : "text-[#66638c] hover:text-[#4d47b6] hover:underline",
  );
}

/** เส้นแบ่งกลุ่มกรองข้อความ */
export const smartPoliceFilterGroupDividerClass =
  "mx-1 inline-block h-3 w-px shrink-0 self-center bg-slate-300/90";

export const smartPoliceFilterTextRowClass =
  "flex w-full flex-wrap items-center gap-x-2 gap-y-1.5";

export const smartPoliceStatInlineClass =
  "flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-0 rounded-md bg-slate-50/90 px-1.5 py-1.5 sm:px-2 sm:py-2";

/** สรุปสถิติแถวเดียว · มือถือเลื่อนแนวนอนได้ */
export const smartPoliceStatsGridClass =
  "flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 sm:overflow-visible";

export const smartPoliceStatCellClass =
  "min-w-[4.75rem] shrink-0 sm:min-w-0 sm:flex-1";

export const smartPoliceListRowClass =
  "flex flex-col gap-2 rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30 sm:flex-row sm:items-center sm:justify-between sm:p-3.5";

export const smartPoliceListRowAccentClass = (
  tone: "indigo" | "violet" | "amber" | "sky" | "emerald" | "rose",
) => {
  const map = {
    indigo: "border-l-[3px] border-l-indigo-500 bg-indigo-50/40 border-indigo-200/80",
    violet: "border-l-[3px] border-l-violet-500 bg-violet-50/40 border-violet-200/80",
    amber: "border-l-[3px] border-l-amber-500 bg-amber-50/40 border-amber-200/80",
    sky: "border-l-[3px] border-l-sky-500 bg-sky-50/40 border-sky-200/80",
    emerald: "border-l-[3px] border-l-emerald-500 bg-emerald-50/40 border-emerald-200/80",
    rose: "border-l-[3px] border-l-rose-500 bg-rose-50/40 border-rose-200/80",
  } as const;
  return cn(
    "flex items-start justify-between gap-2 rounded-lg border p-3 shadow-sm",
    map[tone],
  );
};

export const smartPoliceToastSuccessClass =
  "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800";

export const smartPoliceModuleShellClass =
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm print:hidden";

export function smartPoliceDesktopNavLinkClass(active: boolean): string {
  return cn(
    "flex w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active
      ? "bg-indigo-50 text-[#5b61ff] ring-1 ring-indigo-100"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  );
}

/** @deprecated ใช้ smartPoliceStatInlineClass */
export const smartPoliceStatCardClass = smartPoliceStatInlineClass;

/** @deprecated ใช้ smartPolicePanelClass */
export const smartPoliceHeroCardClass = cn(smartPolicePanelClass, smartPolicePanelSectionClass);

/** @deprecated ใช้ smartPolicePanelClass */
export const smartPoliceInnerCardClass = cn(smartPolicePanelClass, smartPolicePanelSectionClass);

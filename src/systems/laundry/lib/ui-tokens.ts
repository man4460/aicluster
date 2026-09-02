import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/** แผงหลัก — มุมพอดี · ขอบบาง · ไม่ซ้อน glass หลายชั้น */
export const laundryPanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const laundryPanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const laundryPanelDividerClass = "border-t border-slate-200/80";

export const laundrySectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

/** คำบรรยายใต้หัวข้อ — สั้น · ไม่ซ้ำชื่อแท็บ · ซ่อนบนมือถือ */
export const laundrySubtitleClass = "mt-0.5 hidden text-xs font-medium text-[#66638c] sm:block";

/** สถิติแบบเส้นสีซ้าย — ไม่ใช่การ์ดซ้อนการ์ด · ความสูงเต็มช่องกริด */
export const laundryStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

/** แถบเมนูหลักหน้าตั้งค่า (pill) */
export const laundryPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function laundryPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-9 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-md px-3 text-sm font-bold leading-none sm:min-h-10 sm:grow-0 sm:basis-auto sm:px-4",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

export const laundryMobileSelectClass =
  "box-border h-9 w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15";

/** ปุ่มบันทึกคู่หัวตั้งค่า */
export const laundryDashboardSegmentShellClass = cn(
  laundryPrimaryTabShellClass,
  "min-h-9 flex-nowrap items-center gap-0.5 overflow-hidden p-0.5",
);

export function laundryDashboardSegmentBtnClass(active = false): string {
  return cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none transition-all sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

/** เมนูย่อยแบบ compact — มุมขวาบนในการ์ดรายละเอียด (ไม่ inherit w-full จาก primary tab) */
export const laundryInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5 overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5";

export function laundryInlineSubNavBtnClass(active = false): string {
  return cn(
    "inline-flex h-7 min-h-7 w-7 min-w-7 shrink-0 items-center justify-center gap-1 rounded-md px-0 text-[10px] font-semibold leading-none transition-all sm:h-8 sm:min-h-8 sm:w-auto sm:min-w-0 sm:px-2 sm:text-xs",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

/** ปุ่มแอ็กชันแถบหัวแดชบอร์ด — หักแพ็ก / ขายแพ็ก */
export function laundryHeaderActionBtnClass(kind: "deduct" | "sell"): string {
  const base =
    "inline-flex h-7 min-h-7 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-semibold leading-none transition-all sm:h-8 sm:min-h-8 sm:px-2 sm:text-xs";
  if (kind === "sell") {
    return cn(base, appDashboardBrandGradientFillClass, "text-white shadow-sm hover:brightness-[1.03]");
  }
  return cn(
    base,
    "border border-sky-200/80 bg-white text-sky-900 hover:border-sky-300 hover:bg-sky-50",
  );
}

export const laundryPaymentChipIdleClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#2e2a58]";

export const laundryPaymentChipActiveClass = cn(
  "rounded-lg border-transparent px-3 py-1.5 text-xs font-bold text-white shadow-sm",
  appDashboardBrandGradientFillClass,
);

export const laundryCardSurfaceRadiusClass = "rounded-xl";
export const laundryPageStackClass = "min-w-0 space-y-4";
export const laundryCardBodyPaddingXClass = "px-4 sm:px-5";

/** หัว hub การจัดการ — ส่วนบนของแผงเดียว */
export const laundryOffersHubHeaderShellClass = laundryPanelSectionClass;

export const laundryHubContentClass = cn(laundryPanelSectionClass, laundryPanelDividerClass);

export const laundryOffersTabSegmentShellClass = cn(
  laundryDashboardSegmentShellClass,
  "w-full min-w-0 sm:w-auto",
);

export const laundryMutedLoadingNoticeClass =
  "rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm font-medium text-[#66638c]";

export const laundryOffersEmptyStateClass = cn(
  "rounded-lg border border-dashed border-slate-200 bg-slate-50/60",
  laundryCardBodyPaddingXClass,
);

export const laundryOffersListRowCardClass =
  "rounded-lg border border-slate-200/90 bg-white shadow-sm";

export const laundryStatCardClass = cn(
  laundryCardSurfaceRadiusClass,
  "min-h-[5rem] border border-slate-200/90 bg-slate-50/80 p-3 sm:min-h-[5.5rem] sm:p-4",
);

export const laundryInlineAlertErrorClass =
  "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-900";

export const laundrySectionFirstClass = "min-w-0 space-y-3";
export const laundrySectionNextClass = "min-w-0 space-y-3";

export const laundryIconToolbarGroupClass = "inline-flex shrink-0 items-center gap-0.5";

export const laundryModalBackdropClass =
  "fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-4";

export const laundryModalPanelMdClass = cn(
  laundryCardSurfaceRadiusClass,
  "relative z-[201] flex max-h-[min(88vh,36rem)] w-full max-w-md flex-col overflow-hidden border border-slate-200 bg-white shadow-xl",
);

export const laundryModalPanelLgClass = cn(
  laundryCardSurfaceRadiusClass,
  "relative z-[201] flex max-h-[min(92vh,44rem)] w-full max-w-lg flex-col overflow-hidden border border-slate-200 bg-white shadow-xl sm:max-w-xl",
);

export const laundryModalHeaderClass =
  "flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/90 px-5 py-4";

export const laundryModalTitleClass = "text-lg font-bold tracking-tight text-[#1e1b4b]";
export const laundryModalSubtitleClass = "mt-1 text-xs font-medium text-[#66638c]";
export const laundryModalCloseBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#5f5a8a] hover:bg-slate-50";

export const laundryPaymentCtaClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] px-4 py-2 text-sm font-bold text-white shadow-sm";

import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/**
 * ปุ่มโมดูลร้านออนไลน์ — ความสูง · ความมน · padding ชุดเดียว (แม่แบบซักผ้า)
 * หมายเหตุ: `cn` ไม่มี twMerge — ห้ามซ้อนคลาสชนกัน
 */
export const ecommerceStoreBtnRadiusClass = "rounded-lg";
export const ecommerceStoreBtnHeightClass = "box-border h-9 min-h-9 max-h-9";
export const ecommerceStoreBtnPadXClass = "px-2.5";
export const ecommerceStoreBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  ecommerceStoreBtnRadiusClass,
  ecommerceStoreBtnHeightClass,
  "text-[11px] font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs",
);

export const ecommerceStoreOutlineButtonClass = cn(
  ecommerceStoreBtnBaseClass,
  ecommerceStoreBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const ecommerceStorePrimaryButtonClass = cn(
  ecommerceStoreBtnBaseClass,
  ecommerceStoreBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const ecommerceStoreIconButtonClass = cn(
  ecommerceStoreBtnBaseClass,
  "w-9 min-w-9 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const ecommerceStorePrimaryIconButtonClass = cn(
  ecommerceStoreBtnBaseClass,
  "w-9 min-w-9 border border-transparent px-0 text-white",
  appDashboardBrandGradientFillClass,
);

/** ปุ่มไอคอนในแถวการ์ด (± สต๊อก · ตะกร้า) — เล็กกว่าแถบหัว */
export const ecommerceStoreRowIconButtonClass = cn(
  "inline-flex shrink-0 items-center justify-center",
  ecommerceStoreBtnRadiusClass,
  "h-7 w-7 border border-slate-200/90 bg-white text-sm font-black text-[#4d47b6] shadow-sm transition hover:bg-slate-50 disabled:opacity-40",
);

export const ecommerceStoreRowIconDangerClass = cn(
  "inline-flex shrink-0 items-center justify-center",
  ecommerceStoreBtnRadiusClass,
  "h-7 w-7 text-rose-600 transition hover:bg-rose-50",
);

export const ecommerceStoreFieldClass = cn(
  "app-input box-border w-full",
  ecommerceStoreBtnHeightClass,
  ecommerceStoreBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const ecommerceStoreTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  ecommerceStoreBtnRadiusClass,
);

/** หัวโมดูล — plain panel แบบซักผ้า (ไม่ซ้อน glass) */
export const ecommerceStoreModuleShellClass = cn(
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
  "print:hidden",
);

/** @deprecated ใช้ ecommerceStoreModuleShellClass */
export const ecommerceStoreGlassShellClass = ecommerceStoreModuleShellClass;

export const ecommerceStoreAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const ecommerceStoreMainPaddingBottomClass = "pb-24 lg:pb-0";

export const ecommerceStoreSectionRadiusClass = "!rounded-xl";

export const ecommerceStoreDockPillClass = "!rounded-[1.5rem]";

export const ecommerceStoreNavActiveClass = "bg-indigo-50 text-[#5b61ff] ring-1 ring-indigo-100";

export const ecommerceStoreNavIdleClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-700";

export const ecommerceStoreModuleIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-[#5b61ff] text-white shadow-sm";

export const ecommerceStorePanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const ecommerceStorePanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const ecommerceStorePanelDividerClass = "border-t border-slate-200/80";

export const ecommerceStoreSubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

export const ecommerceStorePrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function ecommerceStorePrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-8 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-md px-2.5 text-xs font-bold leading-none sm:min-h-9 sm:grow-0 sm:basis-auto sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

export const ecommerceStoreMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  ecommerceStoreBtnHeightClass,
  ecommerceStoreBtnRadiusClass,
);

export const ecommerceStoreHeaderActionShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5 overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5";

export const ecommerceStoreSettingsHeaderTabShellClass =
  "inline-flex shrink-0 flex-wrap items-center justify-end gap-0.5 rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5 lg:flex-nowrap";

export function ecommerceStoreDashboardSegmentBtnClass(active = false): string {
  return cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none transition-all sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

export function ecommerceStoreSettingsTabPillClass(active: boolean): string {
  return cn(
    ecommerceStoreDashboardSegmentBtnClass(active),
    "shrink-0 whitespace-nowrap px-2.5 sm:px-3",
  );
}

export function ecommerceStoreNavLinkClass(active: boolean): string {
  return cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active ? ecommerceStoreNavActiveClass : ecommerceStoreNavIdleClass,
  );
}

/** แท็บย่อยแดชบอร์ดในแถวหัวการ์ด */
export const ecommerceStoreInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5 rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5";

export function ecommerceStoreInlineSubNavBtnClass(active = false): string {
  return active ? ecommerceStorePrimaryButtonClass : ecommerceStoreOutlineButtonClass;
}

export const ecommerceStoreNavDividerClass = "mx-0.5 hidden h-6 w-px shrink-0 bg-slate-200/90 sm:block";

export const ecommerceStoreSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

/** สถิติเส้นซ้าย — กริด 2 คอลัมน์มือถือ */
export const ecommerceStoreStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const ecommerceStoreDashboardStatsGridClass = "grid grid-cols-2 items-stretch gap-2 sm:gap-3";

export const ecommerceStoreFilterChipShellClass =
  "flex flex-wrap content-start items-center gap-1.5";

export const ecommerceStoreChipIdleClass =
  "rounded-full border border-[#0000BF]/25 bg-white/85 px-4 py-2 text-xs font-black text-[#2e2a58] shadow-sm";

export const ecommerceStoreChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** ชิปช่วงเวลาการเงิน — pill เล็ก (แม่แบบซักผ้า · h-9) */
export function ecommerceStoreFinanceRangeChipClass(active = false): string {
  return cn(
    "inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-bold transition-all sm:text-xs",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
  );
}

/** สรุปการเงิน — กริด 2 คอลัมน์มือถือ · 4 การ์ดบน sm */
export const ecommerceStoreFinanceStatsGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3";

/** การ์ดสรุปแบบเส้นซ้าย + พื้น pastel (แม่แบบ laundry) — มน `rounded-lg` */
export const ecommerceStoreFinanceStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const ecommerceStoreFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** แท็บรายรับ/รายจ่าย — เปลือกเดียวกับ inline sub-nav (rounded-lg) */
export const ecommerceStoreFinanceSubTabShellClass = ecommerceStoreInlineSubNavShellClass;

export function ecommerceStoreFinanceSubTabPillClass(active = false): string {
  return ecommerceStoreInlineSubNavBtnClass(active);
}

/** กรอบกราฟในการเงิน */
export const ecommerceStoreFinanceChartPanelClass =
  "rounded-lg border border-slate-200/90 bg-slate-50/50 p-3 sm:p-4";

/** แถวรายรับ/รายจ่ายในรายการ */
export const ecommerceStoreFinanceListRowClass =
  "rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3";

export const ecommerceStoreContentStackClass = "space-y-4 sm:space-y-5";

/* —— เว็บไซต์ลูกค้า (storefront) —— */

export const ecommerceStorePortalShopNameClass =
  "bg-gradient-to-r from-[#0000BF] via-[#5b61ff] to-[#c026d3] bg-clip-text font-black tracking-tight text-transparent";

export const ecommerceStorePortalShopNameHeroClass = cn(
  ecommerceStorePortalShopNameClass,
  "drop-shadow-[0_1px_8px_rgba(30,27,75,0.35)]",
);

export const ecommerceStorePortalSectionDividerClass = "border-t border-slate-200/80";

export const ecommerceStorePortalPageTitleClass =
  "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

export const ecommerceStorePortalPageSubtitleClass = "text-sm font-semibold text-[#66638c]";

export const ecommerceStorePortalPageBodyClass = cn(
  ecommerceStorePortalSectionDividerClass,
  "mt-3 space-y-4 pt-4 sm:mt-4 sm:pt-5",
);

export const ecommerceStorePortalHeaderNavShellClass =
  "hidden items-center gap-0.5 rounded-lg border border-white/35 bg-white/15 p-0.5 backdrop-blur-md md:inline-flex";

export function ecommerceStorePortalCategoryChipClass(active: boolean): string {
  return cn(
    "shrink-0 min-h-[40px] rounded-lg px-3.5 text-sm font-bold transition",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "border border-slate-200/90 bg-white text-[#4d47b6] hover:bg-slate-50",
  );
}

/* —— POS ขายหน้าร้าน (แม่แบบร้านอาหาร / building-pos) —— */

/** กริดเมนู — มือถือ 3 คอลัมน์แน่น */
export const ecommerceStorePosProductGridClass =
  "grid w-full min-w-0 max-w-full grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8";

/** การ์ดเมนู — รูปสี่เหลี่ยม · glass · hover ยก */
export const ecommerceStorePosProductCardClass =
  "group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/70 bg-gradient-to-br from-white/85 via-white/70 to-violet-50/45 shadow-sm ring-1 ring-inset ring-white/55 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md";

/** แผงบิล / ตะกร้า */
export const ecommerceStorePosDraftPanelClass =
  "rounded-lg border border-white/70 bg-gradient-to-br from-white/90 via-[#f5f3ff]/75 to-[#fdf2f8]/55 p-3 shadow-[0_20px_50px_-20px_rgba(30,27,75,0.4)] backdrop-blur-2xl ring-1 ring-inset ring-white/60 sm:p-4";

export const ecommerceStorePosPulseWashClass = "bg-[#5b61ff]/08";

/** ชิปช่องทางชำระ — แผง POS / PaymentPanel */
export const ecommerceStorePaymentChipIdleClass = cn(
  ecommerceStoreOutlineButtonClass,
  "px-3 text-xs",
);
export const ecommerceStorePaymentChipActiveClass = cn(
  ecommerceStorePrimaryButtonClass,
  "px-3 text-xs",
);
export const ecommerceStorePaymentCtaClass = ecommerceStorePrimaryButtonClass;

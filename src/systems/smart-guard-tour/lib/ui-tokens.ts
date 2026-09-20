import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/**
 * ปุ่ม / การ์ด / แท็บ โมดูลบริหารชมรม — ชุดเดียวกับแม่แบบซักผ้า (plain panel · h-9 · rounded-lg)
 * หมายเหตุ: `cn` ในโปรเจกต์นี้ไม่ใช้ twMerge — ห้ามซ้อนคลาสชนกัน
 */
export const smartGuardTourBtnRadiusClass = "rounded-lg";
export const smartGuardTourBtnHeightClass = "box-border h-9 min-h-9 max-h-9";
export const smartGuardTourBtnPadXClass = "px-2.5";
export const smartGuardTourBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  smartGuardTourBtnRadiusClass,
  smartGuardTourBtnHeightClass,
  "text-[11px] font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs",
);

export const smartGuardTourOutlineButtonClass = cn(
  smartGuardTourBtnBaseClass,
  smartGuardTourBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const smartGuardTourPrimaryButtonClass = cn(
  smartGuardTourBtnBaseClass,
  smartGuardTourBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const smartGuardTourIconButtonClass = cn(
  smartGuardTourBtnBaseClass,
  "w-9 min-w-9 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const smartGuardTourRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

export const smartGuardTourFieldClass = cn(
  "app-input box-border w-full",
  smartGuardTourBtnHeightClass,
  smartGuardTourBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

/** ช่องค้นหาแถวเดียวกับชิปกรอง (เดสก์ท็อป) — ไม่ใช้ w-full */
export const smartGuardTourInlineSearchFieldClass = cn(
  "app-input box-border w-44 min-w-0 shrink-0 lg:w-52",
  smartGuardTourBtnHeightClass,
  smartGuardTourBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const smartGuardTourTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  smartGuardTourBtnRadiusClass,
);

/** แผงหลัก — มุมพอดี · ขอบบาง · ไม่ซ้อน glass */
export const smartGuardTourPanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const smartGuardTourPanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const smartGuardTourPanelDividerClass = "border-t border-slate-200/80";

export const smartGuardTourSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

export const smartGuardTourSubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

export const smartGuardTourPageStackClass = "min-w-0 space-y-4";

export const smartGuardTourPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function smartGuardTourPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-8 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-md px-2.5 text-xs font-bold leading-none sm:min-h-9 sm:grow-0 sm:basis-auto sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

/** เมนูย่อยแถบหัว — แบบซักผ้า (ปุ่ม h-9 คู่กับ action) */
export const smartGuardTourInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5";

/** เส้นบางกั้นระหว่างกลุ่มเมนูในแถบหัว — สูงกลางปุ่ม h-9 */
export const smartGuardTourNavDividerClass =
  "mx-0.5 h-5 w-px shrink-0 self-center bg-slate-200/90";

export function smartGuardTourInlineSubNavBtnClass(active = false): string {
  return active ? smartGuardTourPrimaryButtonClass : smartGuardTourOutlineButtonClass;
}

export const smartGuardTourMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  smartGuardTourBtnHeightClass,
  smartGuardTourBtnRadiusClass,
);

export const smartGuardTourDashboardSegmentShellClass = cn(
  smartGuardTourPrimaryTabShellClass,
  "min-h-9 flex-nowrap items-center gap-0.5 overflow-hidden p-0.5",
);

export function smartGuardTourDashboardSegmentBtnClass(active = false): string {
  return cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none transition-all sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

export const smartGuardTourFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function smartGuardTourFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

/** ชิปช่วงเวลาการเงิน — ชุดปุ่ม h-9 · rounded-lg ตามแม่แบบ finance */
export function smartGuardTourFinanceRangeChipClass(active = false): string {
  return active ? smartGuardTourPrimaryButtonClass : smartGuardTourOutlineButtonClass;
}

export const smartGuardTourFinanceChartPanelClass =
  "rounded-lg border border-slate-200/90 bg-slate-50/50 p-3 sm:p-4";

/** กริดการ์ดกิจกรรมพอร์ทัล: มือถือ 2 · แท็บเล็ต 3 · เดสก์ท็อป 6 */
export const smartGuardTourPortalEventCardGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6";

/** กริดรถบนเว็บลูกค้า: มือถือ 1 · sm 2 · lg 3 */
export const smartGuardTourPortalVehicleGridClass =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3";

/** วิดีโอ YouTube — การ์ด thumb: มือถือ 2 · เดสก์ท็อป 6 */
export const smartGuardTourYoutubeCardGridClass =
  "grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-6";

/** แกลเลอรีรูป — มือถือ 3 · คอม 8 */
export const smartGuardTourGalleryCardGridClass =
  "grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-8";

export const smartGuardTourFinanceStatsGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

export const smartGuardTourFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** กริดการ์ดคำตอบ: มือถือ 1 · sm 2 · lg 3 คอลัมน์ */
export const smartGuardTourSubmissionsCardGridClass =
  "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3";

export const smartGuardTourStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const smartGuardTourRowCardClass =
  "flex flex-col gap-3 rounded-lg border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4";

export const smartGuardTourFixedBottomActionClass =
  "fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 p-3 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none";

/** พอร์ทัลสาธารณะ — เปลือกหัว (ยังใช้ glass) */
export const smartGuardTourGlassShellClass =
  "rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/40 shadow-[0_8px_32px_rgba(30,27,75,0.06)] backdrop-blur-2xl sm:rounded-[2.5rem]";

/** —— เว็บลูกค้าชมรม (แม่แบบซักผ้า) —— */
export const smartGuardTourPortalPrimaryBtnClass = smartGuardTourPrimaryButtonClass;
export const smartGuardTourPortalFieldClass = smartGuardTourFieldClass;

export const smartGuardTourPortalShopNameClass =
  "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] bg-clip-text font-black tracking-tight text-transparent";

export const smartGuardTourPortalShopNameHeroClass = cn(
  smartGuardTourPortalShopNameClass,
  "drop-shadow-[0_1px_8px_rgba(255,255,255,0.55)]",
);

export const smartGuardTourPortalSectionDividerClass = "border-t border-slate-200/80";

export const smartGuardTourPortalPageTitleClass =
  "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

export const smartGuardTourPortalPageSubtitleClass = "text-sm font-semibold text-[#66638c]";

export const smartGuardTourPortalPageBodyClass = cn(
  smartGuardTourPortalSectionDividerClass,
  "mt-4 space-y-4 pt-5",
);

export const smartGuardTourPortalLabelClass = "block text-xs font-bold text-[#4d47b6]";

export const smartGuardTourPortalPublicFieldClass = cn(
  "app-input box-border w-full min-h-[44px] rounded-xl px-3 text-sm font-semibold leading-normal text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const smartGuardTourPortalPublicTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const smartGuardTourPortalQtyRowClass =
  "grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem]";

/** แถบเมนูบนแบนเนอร์โทนมืด (legacy) — โปร่งมาก · ตัวอักษรขาว */
export const smartGuardTourPortalHeaderNavShellClass =
  "hidden items-center gap-0.5 rounded-lg border border-white/45 bg-white/20 p-0.5 backdrop-blur-md md:inline-flex";

/** แถบเมนูบนแบนเนอร์โทนสว่าง — ไม่มีกล่อง · ตัวอักษรเข้ม */
export const smartGuardTourPortalHeaderNavOnLightShellClass =
  "hidden items-center gap-0.5 md:inline-flex sm:gap-1";

export function smartGuardTourPortalHeaderNavLinkClass(): string {
  return cn(
    "inline-flex min-h-9 items-center justify-center rounded-md px-3 text-xs font-semibold text-white/95 transition hover:bg-white/25 sm:px-3.5 sm:text-sm",
  );
}

export function smartGuardTourPortalHeaderNavOnLightLinkClass(): string {
  return cn(
    "inline-flex min-h-9 items-center justify-center px-2.5 text-xs font-semibold text-[#3f3a6a] transition hover:text-[#0000BF] sm:px-3 sm:text-sm",
  );
}

/** เม็ดชื่อชมรมในหัวพอร์ทัล — พื้นขาวชัด */
export const smartGuardTourPortalHeaderBrandPillClass =
  "flex min-w-0 items-center gap-3 rounded-full border border-slate-200/90 bg-white/95 py-1.5 pl-1.5 pr-3 shadow-md backdrop-blur-md";


export const smartGuardTourPortalHeroCompactShellClass =
  "mt-8 grid w-full gap-3 border-t border-white/40 pt-5 text-[#1e1b4b] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-3 sm:rounded-xl sm:border sm:border-slate-200/90 sm:bg-white/95 sm:p-5 sm:pt-5 sm:shadow-sm";

export const smartGuardTourPortalFlatBlockClass = "space-y-4";

export const smartGuardTourPortalInsetPanelClass = cn(
  smartGuardTourPortalSectionDividerClass,
  "space-y-3 bg-slate-50/50 pt-4",
);

/** @deprecated ใช้ smartGuardTourPortalLinkChipClass(type) จาก portal-link-icons */
export const smartGuardTourPortalCardLinkChipClass = cn(
  "inline-flex max-w-full items-center gap-1 rounded-lg border border-violet-200/90 bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-800",
);

/** แถวลิงก์ไอคอนใต้กฎระเบียบ */
export const smartGuardTourPortalRulesLinkRowClass = "mt-3 flex flex-wrap items-stretch gap-2";

/** @deprecated ใช้ smartGuardTourPortalLinkTileClass(type) จาก portal-link-icons */
export const smartGuardTourPortalRulesLinkIconClass = cn(
  "inline-flex min-h-[3rem] min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl border border-violet-200/90 bg-violet-50 px-2.5 py-2 text-violet-800",
);

/** @deprecated ใช้ smartGuardTourPrimaryButtonClass */
export const smartGuardTourNavActiveClass = smartGuardTourPrimaryButtonClass;
/** @deprecated ใช้ smartGuardTourOutlineButtonClass */
export const smartGuardTourNavIdleClass = smartGuardTourOutlineButtonClass;
/** @deprecated dock ใช้ AppMobileDockShell */
export const smartGuardTourMobileDockClass =
  "fixed inset-x-3 bottom-3 z-50 rounded-[2rem] border border-white/50 bg-white/85 p-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur-2xl sm:hidden";
export const smartGuardTourMainPaddingBottomClass = "max-lg:pb-24 lg:pb-0";

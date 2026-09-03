import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/**
 * ปุ่มโมดูลซักผ้า — ขาว / ไล่สีน้ำเงิน–ชมพู
 * ความสูง · ความมน · padding ชุดเดียวทั้งโมดูล (มนเท่ากล่องรายการ `rounded-lg`)
 * หมายเหตุ: `cn` ในโปรเจกต์นี้ไม่ใช้ twMerge — ห้ามซ้อนคลาสชนกัน (เช่น px-4 แล้วตามด้วย px-0)
 */
export const laundryBtnRadiusClass = "rounded-lg";
/** ความสูงมาตรฐานปุ่มโมดูล — รวมแถบหัว (หักแพ็ก · แท็บ · รีเฟรช) */
export const laundryBtnHeightClass = "box-border h-10 min-h-10 max-h-10";
export const laundryBtnPadXClass = "px-3";
export const laundryBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  laundryBtnRadiusClass,
  laundryBtnHeightClass,
  "text-xs font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
);

/** ปุ่มขาวขอบเทา */
export const laundryOutlineButtonClass = cn(
  laundryBtnBaseClass,
  laundryBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

/** ปุ่มไล่สีน้ำเงิน→ชมพู */
export const laundryPrimaryButtonClass = cn(
  laundryBtnBaseClass,
  laundryBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

/** คู่ปุ่มข้อความ — กว้างเท่ากัน (เช่น ก่อนหน้า / ถัดไป) */
export const laundryPairedBtnClass = "min-w-[6.75rem]";

/** ปุ่มไอคอนล้วน — สูงเท่าปุ่มข้อความ (ไม่สืบทอด px จาก outline) */
export const laundryIconButtonClass = cn(
  laundryBtnBaseClass,
  "w-10 min-w-10 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const laundryPrimaryIconButtonClass = cn(
  laundryBtnBaseClass,
  "w-10 min-w-10 border border-transparent px-0 text-white",
  appDashboardBrandGradientFillClass,
);

/** ปุ่มไอคอนในแถวการ์ดรายการ — เล็กกว่าปุ่มแถบหัว */
export const laundryRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

/** @deprecated ใช้ laundryOutlineButtonClass */
export const laundryCompactOutlineButtonClass = laundryOutlineButtonClass;

/** @deprecated ใช้ laundryIconButtonClass */
export const laundryRefreshIconButtonClass = laundryIconButtonClass;

/** @deprecated ใช้ laundryPrimaryButtonClass */
export const laundryPaymentCtaClass = laundryPrimaryButtonClass;

/** @deprecated ใช้ laundryPrimaryButtonClass */
export const laundryPortalPrimaryBtnClass = laundryPrimaryButtonClass;

/** ช่องกรอก — สูง/มนเท่าปุ่มโมดูล (`h-10` · `rounded-lg`) */
export const laundryFieldClass = cn(
  "app-input box-border w-full",
  laundryBtnHeightClass,
  laundryBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

/** textarea — มนเท่าปุ่ม · สูงมากกว่าช่องบรรทัดเดียว */
export const laundryTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  laundryBtnRadiusClass,
);

/** @deprecated ใช้ laundryFieldClass */
export const laundryPortalFieldClass = laundryFieldClass;

/** @deprecated ใช้ laundryTextareaClass */
export const laundryPortalTextareaClass = laundryTextareaClass;

/** แผงหลัก — มุมพอดี · ขอบบาง · ไม่ซ้อน glass หลายชั้น */
export const laundryPanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const laundryPanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const laundryPanelDividerClass = "border-t border-slate-200/80";

export const laundrySectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

/** คำบรรยายใต้หัวข้อ — สั้น · ไม่ซ้ำชื่อแท็บ · ซ่อนบนมือถือ */
export const laundrySubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

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

export const laundryMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  laundryBtnHeightClass,
  laundryBtnRadiusClass,
);

/** ปุ่มแอ็กชันหัวการ์ด — shrink-0 · ห้าม w-full */
export const laundryHeaderActionShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5 overflow-hidden rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5";

/** แถบ segment ในเนื้อหา (เต็มความกว้างได้) */
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

/** แถบเมนูตั้งค่าในแถวหัว (คู่ปุ่มบันทึก) — shrink-0 · ห้าม w-full */
export const laundrySettingsHeaderTabShellClass =
  "inline-flex shrink-0 flex-wrap items-center justify-end gap-0.5 rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5 lg:flex-nowrap";

/** แถบเมนูตั้งค่า — compact · wrap ได้ (เต็มความกว้าง) */
export const laundrySettingsTabShellClass = cn(laundryPrimaryTabShellClass, "p-0.5");

export function laundrySettingsTabPillClass(active: boolean): string {
  return cn(
    laundryDashboardSegmentBtnClass(active),
    "shrink-0 whitespace-nowrap px-2.5 sm:px-3",
  );
}

/** กลุ่มตัวเลือกในฟอร์มตั้งค่า (เช่น โหมดชำระ) */
export const laundrySettingsChoiceShellClass = cn(
  laundryPrimaryTabShellClass,
  "inline-flex h-auto w-auto max-w-full p-0.5",
);

export function laundrySettingsChoiceBtnClass(active = false): string {
  return laundryDashboardSegmentBtnClass(active);
}

/** เมนูย่อยแถบหัว — ปุ่มสูงเท่าหักแพ็ก/รีเฟรช (คลาสเดียว ไม่ซ้อน shell) */
export const laundryInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5";

export function laundryInlineSubNavBtnClass(active = false): string {
  return active ? laundryPrimaryButtonClass : laundryOutlineButtonClass;
}

/** ปุ่มแอ็กชันแถบหัวแดชบอร์ด — หักแพ็ก / ขายแพ็ก */
export function laundryHeaderActionBtnClass(kind: "deduct" | "sell"): string {
  if (kind === "sell") {
    return laundryPrimaryButtonClass;
  }
  return laundryOutlineButtonClass;
}

/** แถวปุ่มหัวแดชบอร์ด/พนักงาน — จัดแนวสูงเท่ากัน */
export const laundryToolbarRowClass =
  "flex shrink-0 flex-nowrap items-center gap-1";


/** ชิปกรองสถานะงาน — ในการ์ดรายการ (compact · wrap) */
export const laundryFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function laundryFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

/** สรุปการเงิน 3 การ์ด — มือถือ 2 คอลัมน์ · ใบสุดท้ายเต็มแถว */
export const laundryFinanceStatsGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

export const laundryFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** ชิปช่วงเวลาการเงิน — pill ตามแม่แบบ finance */
export function laundryFinanceRangeChipClass(active = false): string {
  return cn(
    "inline-flex h-10 shrink-0 items-center justify-center rounded-full px-3.5 text-xs font-bold transition-all sm:text-sm",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "border border-slate-200/90 bg-white text-[#4d47b6] hover:border-[#5b61ff]/35 hover:bg-slate-50",
  );
}

/** แท็บรายรับ / รายจ่าย ในการ์ดการเงิน */
export const laundryFinanceSubTabShellClass =
  "flex w-full items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function laundryFinanceSubTabPillClass(active = false): string {
  return cn(
    "flex min-h-[40px] min-w-0 flex-1 items-center justify-center rounded-md px-2 text-xs font-bold leading-tight transition-all sm:min-h-[44px] sm:px-3 sm:text-sm",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

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
export const laundryModalCloseBtnClass = laundryIconButtonClass;

export const laundryPaymentChipIdleClass = cn(laundryOutlineButtonClass, "px-3 text-xs");

export const laundryPaymentChipActiveClass = cn(laundryPrimaryButtonClass, "px-3 text-xs");

/** ชื่อร้านบนพอร์ทัล — ไล่สีแบรนด์โมดูล */
export const laundryPortalShopNameClass =
  "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] bg-clip-text font-black tracking-tight text-transparent";

/** ชื่อร้านบนแบนเนอร์ (พื้นมืด) — ไล่สี + เงาอ่านง่าย */
export const laundryPortalShopNameHeroClass = cn(
  laundryPortalShopNameClass,
  "drop-shadow-[0_1px_8px_rgba(255,255,255,0.55)]",
);

/** พอร์ทัลพนักงาน — เมนูอยู่หัวหน้าแล้ว ไม่ต้อง padding ล่างพ้น dock */
export const laundryStaffMainPaddingBottomClass = "pb-0";

/** เส้นแบ่งบางในแถบเมนู — สูงกลางปุ่ม h-10 */
export const laundryStaffNavDividerClass = "mx-0.5 h-6 w-px shrink-0 self-center bg-slate-200/90";

/** เนื้อหาแท็บพนักงาน — ไม่ซ้อนกล่องการ์ด */
export const laundryStaffPlainPanelClass = "min-w-0";

/** ระยะขอบในแผงพนักงาน — ชิดขอบกว่าแดชบอร์ดปกติ */
export const laundryStaffPanelSectionClass = "px-2 py-2.5 sm:px-3 sm:py-3";

/** กutter เนื้อหาใต้หัวพนักงาน */
export const laundryStaffContentGutterClass = "px-2 py-2 sm:px-3 sm:py-3";

/** แท็บเมนูพนักงาน — สูงเท่าปุ่มรีเฟรช */
export function laundryStaffNavTabClass(active: boolean): string {
  return active ? laundryPrimaryButtonClass : laundryOutlineButtonClass;
}

export const laundryStaffKioskShellClass =
  "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const laundryPortalLabelClass = "block text-xs font-bold text-[#4d47b6]";

/** ชิป / ปุ่มเลือกบนหน้า pickup — มน·สูงเท่าปุ่มโมดูล */
export const laundryPortalChipIdleClass = laundryOutlineButtonClass;

export const laundryPortalChipActiveClass = laundryPrimaryButtonClass;

export const laundryPortalStepNavBtnClass = laundryOutlineButtonClass;

/** เส้นแบ่งบางระหว่างส่วนในฟอร์มพอร์ทัล (ไม่ใช้กล่องซ้อน) */
export const laundryPortalSectionDividerClass = "border-t border-slate-200/80";

/** หัวข้อใหญ่บนหน้าเว็บลูกค้า */
export const laundryPortalPageTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

/** คำอธิบายใต้หัวข้อ (อยู่ในเนื้อหาหลังเส้น) */
export const laundryPortalPageSubtitleClass = "text-sm font-semibold text-[#66638c]";

/** เนื้อหาหลังหัวข้อ — เส้นบางแล้วรายละเอียด */
export const laundryPortalPageBodyClass = cn(
  laundryPortalSectionDividerClass,
  "mt-4 space-y-4 pt-5",
);

/** แถบเมนูบนพอร์ทัล (เดสก์ท็อป) — มุมเดียวกับ segment โมดูล */
export const laundryPortalHeaderNavShellClass =
  "hidden items-center gap-0.5 rounded-lg border border-white/45 bg-white/20 p-0.5 backdrop-blur-md md:inline-flex";

export function laundryPortalHeaderNavLinkClass(): string {
  return cn(
    "inline-flex min-h-9 items-center justify-center rounded-md px-3 text-xs font-semibold text-white/95 transition hover:bg-white/25 sm:px-3.5 sm:text-sm",
  );
}

/** แถว compact บนแบนเนอร์ — ไม่ห่อการ์ด glass */
export const laundryPortalHeroCompactShellClass =
  "mt-8 grid w-full gap-3 border-t border-white/40 pt-5 text-[#1e1b4b] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:gap-3 sm:rounded-xl sm:border sm:border-slate-200/90 sm:bg-white/95 sm:p-5 sm:pt-5 sm:shadow-sm";

/** บล็อกเนื้อหาแบบ flat — แบ่งด้วยเส้น ไม่มีกรอบการ์ด */
export const laundryPortalFlatBlockClass = "space-y-4";

/** แผงย่อยในฟอร์ม — flat (เส้นบน + พื้นอ่อน ไม่มีกรอบ) */
export const laundryPortalInsetPanelClass = cn(laundryPortalSectionDividerClass, "space-y-3 bg-slate-50/50 pt-4");

/** แบนเนอร์คำเตือนในฟอร์ม (ไม่ใช่ popup) */
export const laundryPortalInfoBannerClass =
  "rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-950";

/** แผงแสดงพิกัด GPS — flat */
export const laundryPortalSuccessPanelClass = cn(
  laundryPortalSectionDividerClass,
  "space-y-2 bg-emerald-50/40 pt-4",
);

/** เลือก tier — flat */
export const laundryPortalTierPickerShellClass = cn(laundryPortalSectionDividerClass, "space-y-2 pt-4");

/** การ์ดเลือกแพ็กพอร์ทัล — คลิกทั้งใบ (เทียบ LaundryOrdersPosClient POS) */
export function laundryPortalPackagePickCardClass(selected = false): string {
  return cn(
    "relative flex h-full w-full flex-col overflow-hidden rounded-lg border text-left transition-all touch-manipulation",
    selected ?
      "border-indigo-400 bg-indigo-50/80 ring-1 ring-indigo-200"
    : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200",
  );
}

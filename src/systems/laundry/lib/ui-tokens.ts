import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientFillClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates/dashboard-tokens";

/** ปุ่มขอบ compact — ใช้ทั้งโมดูลซักผ้า (ตั้งค่า · อัปโหลดรูป · ลิงก์) */
export const laundryCompactOutlineButtonClass = cn(
  appTemplateOutlineButtonClass,
  "inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold",
);

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

export const laundryMobileSelectClass =
  "box-border h-9 w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15";

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

/** พอร์ทัลพนักงาน — เมนูอยู่หัวหน้าแล้ว ไม่ต้อง padding ล่างพ้น dock */
export const laundryStaffMainPaddingBottomClass = "pb-0";

/** เส้นแบ่งบางในแถบเมนูพนักงาน */
export const laundryStaffNavDividerClass = "mx-0.5 h-5 w-px shrink-0 bg-slate-200/90";

/** เนื้อหาแท็บพนักงาน — ไม่ซ้อนกล่องการ์ด */
export const laundryStaffPlainPanelClass = "min-w-0";

/** ระยะขอบในแผงพนักงาน — ชิดขอบกว่าแดชบอร์ดปกติ */
export const laundryStaffPanelSectionClass = "px-2 py-2.5 sm:px-3 sm:py-3";

/** กutter เนื้อหาใต้หัวพนักงาน */
export const laundryStaffContentGutterClass = "px-2 py-2 sm:px-3 sm:py-3";

/** แท็บเมนูพนักงาน — ใช้ segment ของโมดูลซักผ้า */
export function laundryStaffNavTabClass(active: boolean): string {
  return cn(
    laundryDashboardSegmentBtnClass(active),
    "inline-flex min-h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap px-2.5 touch-manipulation active:scale-[0.98] sm:min-h-9 sm:px-3",
  );
}

export const laundryStaffKioskShellClass =
  "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

/** ฟิลด์ฟอร์มเว็บลูกค้า / ขอรับผ้า — เทียบ building-pos portal */
export const laundryPortalFieldClass =
  "app-input min-h-[44px] w-full rounded-2xl px-3 py-2 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400";

export const laundryPortalTextareaClass = cn(laundryPortalFieldClass, "min-h-[88px] resize-y py-2");

export const laundryPortalLabelClass = "block text-xs font-bold text-[#4d47b6]";

export const laundryPortalChipIdleClass =
  "inline-flex min-h-[40px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200";

export const laundryPortalChipActiveClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-full border-transparent px-4 py-2 text-sm font-semibold text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

export const laundryPortalStepNavBtnClass = cn(laundryPortalChipIdleClass, "min-h-[48px] px-5");

export const laundryPortalPrimaryBtnClass = cn(
  "app-btn-primary inline-flex min-h-[48px] items-center justify-center rounded-[1rem] px-6 text-sm font-black disabled:opacity-50",
);

/** แผงย่อยในฟอร์มพอร์ทัล / สรุปรายการ */
export const laundryPortalInsetPanelClass =
  "rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 sm:p-4";

/** แบนเนอร์คำเตือนในฟอร์ม (ไม่ใช่ popup) */
export const laundryPortalInfoBannerClass =
  "rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-950";

/** แผงแสดงพิกัด GPS ที่ดึงได้ */
export const laundryPortalSuccessPanelClass =
  "rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-3 sm:p-4";

/** กล่องเลือก tier ตะกร้า/ราคา */
export const laundryPortalTierPickerShellClass =
  "mt-4 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3";

/** การ์ดเลือกแพ็กพอร์ทัล — คลิกทั้งใบ (เทียบ LaundryOrdersPosClient POS) */
export function laundryPortalPackagePickCardClass(selected = false): string {
  return cn(
    "relative flex h-full w-full flex-col overflow-hidden rounded-lg border text-left transition-all touch-manipulation",
    selected ?
      "border-indigo-400 bg-indigo-50/80 ring-1 ring-indigo-200"
    : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200",
  );
}

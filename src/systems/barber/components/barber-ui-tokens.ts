/**
 * โทน UI ร้านตัดผม — สอดคล้องโรงแรม / นวด (§9 Radius 2.0 / 1.5 / 1.0)
 */
import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/** §9 Surface = 1.5rem — การ์ดย่อย / รายการ */
export const barberCardSurfaceRadiusClass = "rounded-[1.5rem]";

/** §9 Shell = 2.0rem — แผงใหญ่ / section */
export const barberCardLargeRadiusClass = "rounded-[2rem]";

/** §9 Control = 1.0rem */
export const barberInsetControlRadiusClass = "rounded-[1rem]";

/** ทับ AppDashboardSection */
export const barberSectionRadiusClass = "!rounded-[2rem]";

/** dock pill มือถือ */
export const barberDockPillClass = "!rounded-[1.5rem]";

/** padding แนวนอนในการ์ด — มือถือแคบลงให้สัดส่วนจอเล็ก */
export const barberCardBodyPaddingXClass = "px-3 sm:px-4";

/** สถานะว่างแบบเส้นประ (มีพื้นอ่อน) */
export const barberEmptyStateDashedClass =
  `${barberCardSurfaceRadiusClass} border border-dashed border-[#dcd8f0] bg-[#faf9ff]/80 ${barberCardBodyPaddingXClass} py-10`;

/** สถานะว่างแบบเส้นประ (ไม่มีพื้น) */
export const barberEmptyStateDashedPlainClass =
  `${barberCardSurfaceRadiusClass} border border-dashed border-[#dcd8f0] py-10`;

/** แถบโหลด / ข้อความรอง */
export const barberMutedLoadingNoticeClass =
  `${barberCardSurfaceRadiusClass} bg-[#f8f7ff] ${barberCardBodyPaddingXClass} py-3 text-sm text-[#66638c]`;

export const barberNavItemBase =
  `flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2`;

/** สแต็กหลักใต้ PageHeader — ลดการซ้อนกับ app-surface ของเลย์เอาต์ */
export const barberPageStackClass = "min-w-0 space-y-5";

/** เซกชันแรกในเนื้อหาหน้า (ไม่มีเส้นแบ่งบน) */
export const barberSectionFirstClass = "min-w-0 space-y-4";

/** เซกชันถัดไป — แบ่งจากบล็อกก่อนหน้า */
export const barberSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-5";

/** การ์ดแถวรายการมาตรฐาน */
export const barberListRowCardClass =
  `${barberCardSurfaceRadiusClass} border border-[#ecebff] bg-white px-3 py-3 shadow-sm sm:py-2.5`;

export const barberInlineAlertErrorClass =
  `${barberCardSurfaceRadiusClass} border border-red-200/80 bg-red-50/90 ${barberCardBodyPaddingXClass} py-3 text-sm leading-relaxed text-red-800`;

export const barberInlineAlertSuccessClass =
  `${barberCardSurfaceRadiusClass} border border-emerald-200/80 bg-emerald-50/90 ${barberCardBodyPaddingXClass} py-3 text-sm text-emerald-900`;

/** กลุ่มปุ่มไอคอนแนวร้านตัดผม */
export const barberIconToolbarGroupClass =
  `flex items-center gap-0.5 rounded-[2rem] md:rounded-[1.25rem] border border-[#e8e6f8] bg-[#f8f7ff] p-0.5`;

/** ปุ่มกลับแดชบอร์ด — สูงเท่าปุ่มหลัก MAWELL (app-btn-soft) */
export const barberDashboardBackLinkClass =
  `app-btn-soft inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[2rem] px-4 py-2.5 text-sm font-semibold text-[#2e2a58] md:rounded-[1.25rem] print:hidden`;

/** แถวปุ่มหัวเซกชัน (ย้อนกลับ + ปุ่มหลัก) */
export const barberSectionActionsRowClass = "flex flex-wrap items-center gap-2 sm:gap-3";

/** แผงหน้ารวม QR — โทนเดียว ไม่ซ้อนกับกรอบพรีวิวหนัก */
export const barberQrHubPanelClass =
  `min-w-0 overflow-hidden ${barberCardLargeRadiusClass} border border-white/45 bg-gradient-to-br from-white/48 via-white/32 to-indigo-50/[0.12] p-5 shadow-[0_18px_44px_-30px_rgba(30,27,75,0.28)] backdrop-blur-md sm:p-7 md:p-8`;

/** รูปโปสเตอร์ในหน้า QR hub — ไม่ใส่แหวนขาวหนา (ลดความรู้สึกการ์ดซ้อน) */
export const barberQrHubPreviewImgClass =
  "relative z-[1] mx-auto h-auto w-full max-w-[300px] rounded-[1.25rem] shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)] sm:max-w-[340px] sm:rounded-[2rem]";

/** แถบปุ่มเครื่องมือในหน้า QR */
export const barberQrHubToolbarClass =
  `${barberCardSurfaceRadiusClass} flex flex-wrap gap-2 border border-white/45 bg-white/30 p-2.5 backdrop-blur-sm`;

/** การ์ดสถิติย่อยใต้แดชบอร์ด */
export const barberStatCardClass =
  `flex min-h-[100px] flex-col justify-center ${barberCardSurfaceRadiusClass} border border-[#e8e6f4]/80 bg-white p-4 shadow-sm`;

/** หัวหน้าแพ็กเกจ/สมาชิก — พื้นไล่สีนุ่ม */
export const barberOffersHubHeaderShellClass =
  `${barberCardSurfaceRadiusClass} border border-white/60 bg-gradient-to-br from-[#f5f3ff] via-white to-[#ecfdf5]/40 p-4 shadow-[0_14px_44px_-30px_rgba(79,70,229,0.2)] sm:p-5`;

/** แท็บแบ่งแพ็กเกจ / สมาชิก — กรอบชั้นเดียว */
export const barberOffersTabSegmentShellClass =
  `${barberCardSurfaceRadiusClass} flex shrink-0 items-center gap-1 border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-[#f0fdfa]/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]`;

/** การ์ดแถวในหน้าแพ็กเกจ/สมาชิก — เฉดขาวถึงม่วงอมฟ้าอ่อน (padding แนวนอนตามมาตรฐานการ์ดย่อย) */
export const barberOffersListRowCardClass =
  `${barberCardSurfaceRadiusClass} relative overflow-hidden border border-[#e8e6f4]/90 bg-gradient-to-br from-white via-white to-[#faf9ff]/95 ${barberCardBodyPaddingXClass} py-3 shadow-[0_8px_26px_-18px_rgba(91,97,255,0.16)] transition-[box-shadow,border-color] duration-300 sm:py-2.5 hover:border-[#d4cff7]/95 hover:shadow-[0_14px_36px_-22px_rgba(79,70,229,0.18)]`;

/** สถานะว่างแพ็กเกจ/สมาชิก — เส้นประ + ไล่สีพื้น */
export const barberOffersEmptyStateClass =
  `${barberCardSurfaceRadiusClass} border border-dashed border-[#d4cff7]/75 bg-gradient-to-b from-[#faf9ff] via-white to-[#f5f3ff]/45 ${barberCardBodyPaddingXClass} py-10`;

/** แถบกรอง/นับรายการสมาชิก */
export const barberOffersFilterBarClass =
  `${barberCardSurfaceRadiusClass} border border-[#e8e6f4]/85 bg-gradient-to-r from-[#faf9ff]/95 via-white to-[#f0fdf9]/35 px-3 py-2.5 shadow-sm sm:px-4`;

/** หัวหน้าหน้าการเงิน — โทนเดียวกับแพ็กเกจ/สมาชิก */
export const barberFinanceHubHeaderShellClass = barberOffersHubHeaderShellClass;

// --- Design System tokens (baseline drink-pos · football-turf — MASTER.md) ---

/** เปลือกหัวโมดูล glass — §9 Shell 2.0rem (โรงแรม) */
export const barberGlassShellClass = cn(
  "overflow-hidden rounded-[2rem] border border-white/50",
  "bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
);

/** การ์ดนอกหุ้มเนื้อหาใต้หัวโมดูล — §9 Shell 2.0rem */
export const barberModuleContentShellClass = cn(
  "min-w-0 overflow-hidden rounded-[2rem] border border-white/45 bg-white/35 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
  "p-4 sm:p-5 md:p-6 print:border-0 print:shadow-none",
);

/** Accent bar ในหัวหลักเท่านั้น — หลังเส้นต้องมี `mt-5` ก่อนเนื้อหาใต้ */
export const barberAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

/** padding-bottom safe area เมื่อมี bottom dock — baseline: football-turf */
export const barberMainPaddingBottomClass = "pb-24 lg:pb-0";

/** Nav active state — ใช้ brand gradient + text-white (ห้ามโทนดำ) */
export const barberNavActiveClass = cn("text-white shadow-md", appDashboardBrandGradientFillClass);

/** Nav idle state — baseline drink-pos/football-turf */
export const barberNavIdleClass = "text-slate-500 hover:bg-white/55 hover:text-slate-700";

/** Chip active state — rounded-full gradient white text */
export const barberChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** Chip idle state — white bg + muted text */
export const barberChipIdleClass =
  "text-slate-500 bg-white/55 hover:bg-white/80 rounded-full border border-[#0000BF]/25 px-4 py-2 text-xs font-black shadow-sm text-[#2e2a58]";

/** Edge-to-edge chip scroller — -mx offset matching shell padding */
export const barberChipScrollerClass =
  "overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 sm:-mx-8 sm:px-8";

/** Row class inside chip scroller */
export const barberChipRowClass = "flex w-max gap-2";

/** Sub-tab segment shell — ใช้ครอบ tab group ปุ่ม */
export const barberSubTabSegmentShellClass = cn(
  `${barberCardSurfaceRadiusClass} flex shrink-0 items-center gap-1 border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-[#f0fdfa]/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]`,
);

/** แถวเครื่องมือหัวแดชบอร์ด: ปุ่มแอ็กชันซ้าย · เมนูแท็บชิดขวา */
export const barberDashboardToolsRowClass =
  "flex min-w-0 flex-wrap items-center justify-end gap-2 overflow-visible";

/** ความสูงมาตรฐานของ segment ควบคู่เมนูแท็บ — ไม่ scroll ในกล่อง */
export const barberDashboardSegmentShellClass = cn(
  barberSubTabSegmentShellClass,
  "min-h-10 flex-nowrap items-center gap-0.5 overflow-hidden p-0.5",
);

/** ปุ่มใน segment หัวแดชบอร์ด (โทนเดียวกับแท็บ) */
export const barberDashboardSegmentBtnClass = (active = false) =>
  cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-[0.85rem] px-2.5 text-xs font-bold leading-none transition-all sm:px-3",
    active ? barberNavActiveClass : barberNavIdleClass,
  );


/** ระยะ content stack แนวตั้งภายใน shell — gap-4 mobile / gap-6 desktop */
export const barberContentStackClass = "space-y-4 sm:space-y-6";

/** Spacing cadence: top spacing ก่อนกราฟ (compact) */
export const barberChartTopSpacingClass = "mt-4";

/** Spacing cadence: section divider ก่อนกราฟ (มีเส้นคั่น) */
export const barberChartSectionDividerClass = "mt-6 border-t border-[#ecebff] pt-6";

/** Filter field grid layout — 1 col mobile, 2 col desktop */
export const barberFilterFieldGridClass = "grid gap-3 sm:grid-cols-2";

/** Field / input — §9 Control 1.0rem */
export const barberFieldClass =
  "w-full rounded-[1rem] border border-white/60 bg-white/85 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#0000BF]/20 focus:ring-2";

/** สถิติมือถือ 2 คอลัมน์ */
export const barberStatGridClass = "grid grid-cols-2 gap-3 sm:grid-cols-3";

/** Booking / check-in card grid — ตั้งแต่ sm ขึ้นไป 3 คอลัมน์ */
export const barberBookingGridClass = "grid gap-4 sm:grid-cols-3";

/** Product / list grid — md 3 col */
export const barberProductGridClass = "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

/** Module icon gradient wrapper — h-10 w-10 rounded-2xl (baseline shell header) */
export const barberModuleIconBadgeClass = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-indigo-100",
  appDashboardBrandGradientFillClass,
);

/** Header collapse ปุ่ม (ซ่อน/แสดงหัวโมดูล) — icon-only h-10 w-10 */
export const barberHeaderCollapseBtnClass =
  "h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-[0.98]";

/** Small-caps English label บนหัวข้อ header (MASTER.md §7) */
export const barberHeaderEnLabelClass =
  "text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]";

/** CTA button class — brand gradient white text rounded-xl shadow-md */
export const barberCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** Payment chips — คู่กับ hotelResortPaymentChip* */
export const barberPaymentChipIdleClass =
  "rounded-full border border-[#0000BF]/25 bg-white/85 px-4 py-2 text-xs font-black text-[#2e2a58] shadow-sm";

export const barberPaymentChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** CTA ในแผงชำระ (แสดง QR ให้ลูกค้า) */
export const barberPaymentCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-[1rem] px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** Header toolbar group ครอบ ปุ่มซ่อนหัว + คู่มือ — gap ระหว่างปุ่ม */
export const barberHeaderToolbarGroupClass = "flex shrink-0 items-center gap-2";

// --- Modal (พอร์ทัลที่ document.body — กึ่งกลางจอ + safe area + z เหนือ dock) ---

const barberModalMaxHeightClass =
  "max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top,0px))-max(0.75rem,env(safe-area-inset-bottom,0px)))] sm:max-h-[calc(100dvh-2rem)]";

const barberModalPanelScrollableShell =
  `w-full min-h-0 touch-pan-y overflow-y-auto overscroll-y-contain ${barberCardSurfaceRadiusClass} border border-slate-200 bg-white shadow-2xl [-webkit-overflow-scrolling:touch]`;

/** พื้นหลังโมดัลทั่วไป (โทนเดียวกับ「ช่างที่บันทึก」) */
export const barberModalBackdropClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** คู่มือ — พื้นเข้มขึ้นเล็กน้อย */
export const barberModalBackdropMutedClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** พรีวิวรูปเต็มจอ */
export const barberModalBackdropImagePreviewClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** โอเวอร์เลย์กล้องถ่ายสลิป (เหนือ dock) */
export const barberModalCameraBackdropClass =
  "fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-black/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** การ์ดโมดัลเลื่อนได้ — max-w-md */
export const barberModalPanelMdClass = `${barberModalMaxHeightClass} ${barberModalPanelScrollableShell} max-w-md`;

/** การ์ดโมดัลเลื่อนได้ — max-w-lg */
export const barberModalPanelLgClass = `${barberModalMaxHeightClass} ${barberModalPanelScrollableShell} max-w-lg`;

/** คู่มือ — หัวติดบน เนื้อหาเลื่อนใน */
export const barberModalPanel2xlFlexColClass = `${barberModalMaxHeightClass} flex w-full max-w-2xl min-h-0 flex-col overflow-hidden ${barberCardSurfaceRadiusClass} border border-slate-200 bg-white shadow-2xl`;

export const barberModalHeaderClass =
  "flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4";

export const barberModalTitleClass = "text-lg font-bold text-[#2e2a58]";

export const barberModalSubtitleClass = "mt-1 text-xs text-[#66638c]";

export const barberModalCloseBtnClass =
  "shrink-0 rounded-[1.25rem] px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800";

/** ปิดพรีวิวรูป — เว้น safe area */
export const barberModalImagePreviewCloseBtnClass =
  "absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] rounded-[1.25rem] bg-white/90 px-3 py-1 text-sm font-semibold text-[#2e2a58] shadow";

/** แถบเมนูหลักหน้าตั้งค่า (pill) */
export const barberPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:rounded-[1.35rem] sm:p-1.5";

export function barberPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-10 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-xl px-3 text-sm font-black leading-none sm:min-h-11 sm:grow-0 sm:basis-auto sm:px-4 sm:text-[15px]",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md")
      : "bg-white/50 text-[#5f5a8a] transition hover:bg-white/90 hover:text-[#4d47b6]",
  );
}

export const barberMobileSelectClass =
  "box-border h-9 w-full min-w-0 appearance-none rounded-xl border border-[#e4e0f5] bg-white/95 px-3 pr-8 text-xs font-black text-[#1e1b4b] shadow-sm outline-none ring-1 ring-inset ring-white/70 focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

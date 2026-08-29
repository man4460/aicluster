import { cn } from "@/lib/cn";

/**
 * โทน UI ร้านนวด — Design System §1–§12
 * §9 Radius System 2.0/1.5: Shell 2rem / Surface 1.5rem / Control 1rem
 * §4 Nav Active: gradient brand highlight
 * §10 Full-width edge-to-screen (DashboardPagesShell จัดการ outer)
 * §7 EN Label + no description under headers
 * §8 Grids: Stat cards 5-col lg+ (เพราะมี 5 ใบพอดี 1 แถว)
 */

/** §9 shell radius = 2.0rem (wrapper หลักสุด) */
export const massageShellRadiusClass = "rounded-[2rem]";

/** §9 surface radius = 1.5rem (การ์ดย่อยๆ, stat cards, list rows, แถบ filter) */
export const massageSurfaceRadiusClass = "rounded-[1.5rem]";

/** alias — ชื่อเดิมที่คอมโพเนนต์ยัง import */
export const massageCardSurfaceRadiusClass = massageSurfaceRadiusClass;

/** §9 control radius = 1.0rem (input, button ย่อย, badge) */
export const massageControlRadiusClass = "rounded-[1rem]";

/** §9 large card (panel inner ขนาดใหญ่) */
export const massageCardLargeRadiusClass = "rounded-[2.5rem]";

/** padding แนวนอนในการ์ด — มือถือแคบลงให้สัดส่วนจอเล็ก */
export const massageCardBodyPaddingXClass = "px-3 sm:px-4";

/** สถานะว่างแบบเส้นประ (มีพื้นอ่อน) */
export const massageEmptyStateDashedClass =
  `${massageSurfaceRadiusClass} border border-dashed border-[#dcd8f0] bg-[#faf9ff]/80 ${massageCardBodyPaddingXClass} py-10`;

/** สถานะว่างแบบเส้นประ (ไม่มีพื้น) */
export const massageEmptyStateDashedPlainClass =
  `${massageSurfaceRadiusClass} border border-dashed border-[#dcd8f0] py-10`;

/** แถบโหลด / ข้อความรอง */
export const massageMutedLoadingNoticeClass =
  `${massageSurfaceRadiusClass} bg-[#f8f7ff] ${massageCardBodyPaddingXClass} py-3 text-sm text-[#66638c]`;

/** §4 Nav item base (desktop + mobile shared) — §9 control 1rem rounded-xl ใกล้เคียง */
export const massageNavItemBaseClass =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

/**
 * §4 Nav Active Gradient (ตัวเดียว single source of truth)
 * ใช้ใน: MassageModuleDesktopNav tab active, MassageModuleMobileDock tab active,
 * MassageDashboardTabToolbar tab active, MassageHeaderBarNav desktop fallback tab inverse
 */
export const massageNavActiveGradientClass = cn(
  "bg-gradient-to-r from-[#4f46e5]/95 via-[#7c3aed]/95 to-[#ec4899]/90",
  "text-white shadow-[0_10px_30px_-18px_rgba(124,58,237,0.55)] ring-1 ring-white/40",
);
export const massageNavIdleClass =
  "text-slate-600/85 hover:bg-white/55 hover:text-[#2e2a58]";

/** เผื่อ dock พนักงานมือถือ */
export const massageMainPaddingBottomClass = "pb-24 lg:pb-0";

/** alias โทน active สำหรับแท็บพนักงาน */
export const massageNavActiveClass = massageNavActiveGradientClass;

/** §4 Nav Active INVERSE (บน global header bar — สีขาวบนพื้นสีม่วง) */
export const massageNavInverseActiveClass =
  "bg-white text-[#4d47b6] shadow-md shadow-black/25 ring-1 ring-white/50";
export const massageNavInverseIdleClass =
  "text-white/85 hover:bg-white/15 hover:text-white";

/** สแต็กหลักใต้ PageHeader — ลดการซ้อนกับ app-surface ของเลย์เอาต์ */
export const massagePageStackClass = "min-w-0 space-y-4 sm:space-y-5";

/** เซกชันแรกในเนื้อหาหน้า (ไม่มีเส้นแบ่งบน) */
export const massageSectionFirstClass = "min-w-0 space-y-4";

/** เซกชันถัดไป — แบ่งจากบล็อกก่อนหน้า */
export const massageSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-4 sm:pt-5";

/** §8 Stat card grid — มี 5 ใบพอดี → lg+ 5 คอลัมน์ 1 แถว (md+ 3col, mobile 2col top+3 bottom จะ L-shape แต่ mobile ยอมรับได้) */
export const massageStatGridClass = "grid gap-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5";

/** การ์ดสถิติย่อยใต้แดชบอร์ด */
export const massageStatCardClass =
  `flex min-h-[100px] flex-col justify-center ${massageSurfaceRadiusClass} border border-[#e8e6f4]/80 bg-white p-4 shadow-sm`;

/** การ์ดแถวรายการมาตรฐาน */
export const massageListRowCardClass =
  `${massageSurfaceRadiusClass} border border-[#ecebff] bg-white px-3 py-3 shadow-sm sm:py-2.5`;

export const massageInlineAlertErrorClass =
  `${massageSurfaceRadiusClass} border border-red-200/80 bg-red-50/90 ${massageCardBodyPaddingXClass} py-3 text-sm leading-relaxed text-red-800`;

export const massageInlineAlertSuccessClass =
  `${massageSurfaceRadiusClass} border border-emerald-200/80 bg-emerald-50/90 ${massageCardBodyPaddingXClass} py-3 text-sm text-emerald-900`;

/** กลุ่มปุ่มไอคอนแนวร้านนวด */
export const massageIconToolbarGroupClass =
  `flex items-center gap-0.5 ${massageShellRadiusClass} md:${massageControlRadiusClass} border border-[#e8e6f8] bg-[#f8f7ff] p-0.5`;

/** ปุ่มกลับแดชบอร์ด */
export const massageDashboardBackLinkClass =
  `app-btn-soft inline-flex min-h-[44px] shrink-0 items-center justify-center ${massageShellRadiusClass} px-4 py-2.5 text-sm font-bold text-[#2e2a58] md:${massageControlRadiusClass} print:hidden`;

/** แถวปุ่มหัวเซกชัน */
export const massageSectionActionsRowClass = "flex flex-wrap items-center gap-2 sm:gap-3";

/** แผงหน้ารวม QR */
export const massageQrHubPanelClass =
  `min-w-0 overflow-hidden ${massageCardLargeRadiusClass} border border-white/45 bg-gradient-to-br from-white/48 via-white/32 to-indigo-50/[0.12] p-5 shadow-[0_18px_44px_-30px_rgba(30,27,75,0.28)] backdrop-blur-md sm:p-7 md:p-8`;

/** รูปโปสเตอร์ในหน้า QR hub */
export const massageQrHubPreviewImgClass =
  "relative z-[1] mx-auto h-auto w-full max-w-[300px] rounded-[1rem] shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)] sm:max-w-[340px] sm:rounded-[1.5rem]";

/** แถบปุ่มเครื่องมือในหน้า QR */
export const massageQrHubToolbarClass =
  `${massageSurfaceRadiusClass} flex flex-wrap gap-2 border border-white/45 bg-white/30 p-2.5 backdrop-blur-sm`;

// --- §14 Finance Module UI tokens (ตามรูปแบบโรงแรมมาตรฐาน ---

/** §14 Finance SubTabs shell (2 ใบ: ประวัติ/รายรับ · รายจ่าย) = 1.25rem radius gradient white-fa-indigo inset shadow */
export const massageFinanceSubTabShellClass =
  "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

/** §14 Finance stats grid: 3 ใบ (รายได้/ต้นทุน/กำไร) — mobile 2-col sm+ 3-col, gaps 2 sm=3, mt-4 */
export const massageFinanceStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";

/** §14 Finance stat ใบสุดท้าย (กำไร): mobile col-span-2 (เต็มแถวเดียวล่าง) → sm+ col-span-1 กลับคืน 3-col พอดี */
export const massageFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** §14 Finance stat list item card base (ใช้ทั้ง history row + cost row) = 1.25rem mobile / 2rem desktop */
export const massageFinanceListItemCardClass =
  `rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4`;

/** §14 Filter chip (rounded-full, active = solid indigo #5b61ff fill, idle = white border soft)
 *  ใช้กับ range chips: วันนี้/เดือนนี้/ปีนี้/กำหนดเอง + category filters ในรายจ่าย
 */
export const massageFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-4 py-2 text-xs font-black text-white shadow-md"
    : "rounded-full border border-[#dedbf0]/90 bg-white/70 px-4 py-2 text-xs font-bold text-[#5b61ff] hover:bg-white hover:shadow-sm";

/** §14 Finance form field base (date, text, keyword search input) */
export const massageFinanceFieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-left text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

/** หัวหน้าแพ็กเกจ/สมาชิก */
export const massageOffersHubHeaderShellClass =
  `${massageSurfaceRadiusClass} border border-white/60 bg-gradient-to-br from-[#f5f3ff] via-white to-[#ecfdf5]/40 p-4 shadow-[0_14px_44px_-30px_rgba(79,70,229,0.2)] sm:p-5`;

/** แท็บแบ่งแพ็กเกจ / สมาชิก */
export const massageOffersTabSegmentShellClass =
  `${massageSurfaceRadiusClass} flex shrink-0 items-center gap-1 border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-[#f0fdfa]/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]`;

/** การ์ดแถวในหน้าแพ็กเกจ/สมาชิก */
export const massageOffersListRowCardClass =
  `${massageSurfaceRadiusClass} relative overflow-hidden border border-[#e8e6f4]/90 bg-gradient-to-br from-white via-white to-[#faf9ff]/95 ${massageCardBodyPaddingXClass} py-3 shadow-[0_8px_26px_-18px_rgba(91,97,255,0.16)] transition-[box-shadow,border-color] duration-300 sm:py-2.5 hover:border-[#d4cff7]/95 hover:shadow-[0_14px_36px_-22px_rgba(79,70,229,0.18)]`;

/** สถานะว่างแพ็กเกจ/สมาชิก */
export const massageOffersEmptyStateClass =
  `${massageSurfaceRadiusClass} border border-dashed border-[#d4cff7]/75 bg-gradient-to-b from-[#faf9ff] via-white to-[#f5f3ff]/45 ${massageCardBodyPaddingXClass} py-10`;

/** แถบกรอง/นับรายการสมาชิก */
export const massageOffersFilterBarClass =
  `${massageSurfaceRadiusClass} border border-[#e8e6f4]/85 bg-gradient-to-r from-[#faf9ff]/95 via-white to-[#f0fdf9]/35 px-3 py-2.5 shadow-sm sm:px-4`;

/** หัวหน้าหน้าการเงิน — โทนเดียวกับแพ็กเกจ/สมาชิก */
export const massageFinanceHubHeaderShellClass = massageOffersHubHeaderShellClass;

// --- Modal ---

const massageModalMaxHeightClass =
  "max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top,0px))-max(0.75rem,env(safe-area-inset-bottom,0px)))] sm:max-h-[calc(100dvh-2rem)]";

const massageModalPanelScrollableShell =
  `w-full min-h-0 touch-pan-y overflow-y-auto overscroll-y-contain ${massageSurfaceRadiusClass} border border-slate-200 bg-white shadow-2xl [-webkit-overflow-scrolling:touch]`;

export const massageModalBackdropClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

export const massageModalBackdropMutedClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

export const massageModalBackdropImagePreviewClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

export const massageModalCameraBackdropClass =
  "fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-black/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

export const massageModalPanelMdClass = `${massageModalMaxHeightClass} ${massageModalPanelScrollableShell} max-w-md`;
export const massageModalPanelLgClass = `${massageModalMaxHeightClass} ${massageModalPanelScrollableShell} max-w-lg`;

export const massageModalPanel2xlFlexColClass = `${massageModalMaxHeightClass} flex w-full max-w-2xl min-h-0 flex-col overflow-hidden ${massageSurfaceRadiusClass} border border-slate-200 bg-white shadow-2xl`;

export const massageModalHeaderClass =
  "flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4";

export const massageModalTitleClass = "text-lg font-bold text-[#2e2a58]";
export const massageModalSubtitleClass = "mt-1 text-xs text-[#66638c]";

export const massageModalCloseBtnClass =
  `shrink-0 ${massageControlRadiusClass} px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800`;

export const massageModalImagePreviewCloseBtnClass =
  `absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] ${massageControlRadiusClass} bg-white/90 px-3 py-1 text-sm font-bold text-[#2e2a58] shadow`;

// --- §12 Shell Wrapper (Module chrome header + nav wrapper) ---
// ใช้ตรงกับ hotel/car-wash pattern เพื่อให้ `hidden` class ซ่อนทั้งใบ header ได้เลย

/** Brand gradient fill สำหรับ shell glass accent bar ด้านบน (§4 accent bar บนมือถือ) */
export const massageBrandGradientFillClass =
  "bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899]";

/** Shell wrapper (glass header + desktop nav container) — single class รวม padding, shadow, backdrop ใช้ซ้ำทุกที่ */
export const massageShellWrapperClass = cn(
  "relative overflow-hidden rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/50 via-indigo-50/25 to-fuchsia-100/20",
  "p-4 sm:px-8 sm:py-6 print:hidden",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl",
  "ring-1 ring-inset ring-white/55",
);

/** §4 Accent bar (แถบเส้นสีไล่ 3 สี ม่วง-ชมพู ด้านซ้ายบน header สำหรับมือถือ) */
export const massageShellAccentBarClass = cn(
  "pointer-events-none absolute left-4 right-4 top-0 h-[3px] rounded-full opacity-85 sm:left-8 sm:right-8",
  massageBrandGradientFillClass,
  "shadow-[0_4px_20px_-6px_rgba(236,72,153,0.35)]",
);

/** Module shell inner content wrapper (ใต้ header chrome) */
export const massageModuleContentShellClass = cn(
  "min-w-0 overflow-hidden rounded-[2rem] border border-white/45 bg-white/35 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
  "p-4 sm:p-5 md:p-6 print:border-0 print:shadow-none",
);

/** §7 EN Label title accent (หน่วยย่อย) — ใช้คู่กับหัวข้อหลัก TH ด้านบน (label capital tracking-[0.22em]) */
export const massageEnEyebrowLabelClass =
  "text-[10px] font-black uppercase tracking-[0.22em] text-[#7c7aab] sm:text-[11px]";

/** §10 Full-width horizontal scroll (scroller) — hide scrollbar on touch devices */
export const massageHorizontalScrollerClass =
  "flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden";

/** Header toolbar group (ปุ่มซ่อนหัว + คู่มือ + icon actions) */
export const massageHeaderToolbarGroupClass = "flex shrink-0 items-center gap-2";

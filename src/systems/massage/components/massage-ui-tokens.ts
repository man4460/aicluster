/**
 * โทน UI ร้านนวด — ให้สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

/** โค้งการ์ด/แผงย่อยในโมดูล — เทียบ CarWashStat / แถวรายการคาร์แคร์ (rounded-[2rem]) */
export const massageCardSurfaceRadiusClass = "rounded-[2rem]";

/** แผงใหญ่ชั้นใน (คู่กับเปลือกโมดูล rounded-[2.5rem]) */
export const massageCardLargeRadiusClass = "rounded-[2.5rem]";

/** ช่องป้อนข้อมูล / แถบแจ้งเตือนเล็ก / รูปย่อ — โค้งรองจากการ์ดหลัก */
export const massageInsetControlRadiusClass = "rounded-[1.25rem]";

/** padding แนวนอนในการ์ด — มือถือแคบลงให้สัดส่วนจอเล็ก */
export const massageCardBodyPaddingXClass = "px-2.5 sm:px-4";

/** สถานะว่างแบบเส้นประ (มีพื้นอ่อน) */
export const massageEmptyStateDashedClass =
  `${massageCardSurfaceRadiusClass} border border-dashed border-[#dcd8f0] bg-[#faf9ff]/80 ${massageCardBodyPaddingXClass} py-10`;

/** สถานะว่างแบบเส้นประ (ไม่มีพื้น) */
export const massageEmptyStateDashedPlainClass =
  `${massageCardSurfaceRadiusClass} border border-dashed border-[#dcd8f0] py-10`;

/** แถบโหลด / ข้อความรอง */
export const massageMutedLoadingNoticeClass =
  `${massageCardSurfaceRadiusClass} bg-[#f8f7ff] ${massageCardBodyPaddingXClass} py-3 text-sm text-[#66638c]`;

export const massageNavItemBase =
  `flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2`;

/** สแต็กหลักใต้ PageHeader — ลดการซ้อนกับ app-surface ของเลย์เอาต์ */
export const massagePageStackClass = "min-w-0 space-y-5";

/** เซกชันแรกในเนื้อหาหน้า (ไม่มีเส้นแบ่งบน) */
export const massageSectionFirstClass = "min-w-0 space-y-4";

/** เซกชันถัดไป — แบ่งจากบล็อกก่อนหน้า */
export const massageSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-5";

/** การ์ดแถวรายการมาตรฐาน */
export const massageListRowCardClass =
  `${massageCardSurfaceRadiusClass} border border-[#ecebff] bg-white px-3 py-3 shadow-sm sm:py-2.5`;

export const massageInlineAlertErrorClass =
  `${massageCardSurfaceRadiusClass} border border-red-200/80 bg-red-50/90 ${massageCardBodyPaddingXClass} py-3 text-sm leading-relaxed text-red-800`;

export const massageInlineAlertSuccessClass =
  `${massageCardSurfaceRadiusClass} border border-emerald-200/80 bg-emerald-50/90 ${massageCardBodyPaddingXClass} py-3 text-sm text-emerald-900`;

/** กลุ่มปุ่มไอคอนแนวร้านนวด */
export const massageIconToolbarGroupClass =
  `flex items-center gap-0.5 rounded-[2rem] md:rounded-[1.25rem] border border-[#e8e6f8] bg-[#f8f7ff] p-0.5`;

/** ปุ่มกลับแดชบอร์ด — สูงเท่าปุ่มหลัก MAWELL (app-btn-soft) */
export const massageDashboardBackLinkClass =
  `app-btn-soft inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[2rem] px-4 py-2.5 text-sm font-semibold text-[#2e2a58] md:rounded-[1.25rem] print:hidden`;

/** แถวปุ่มหัวเซกชัน (ย้อนกลับ + ปุ่มหลัก) */
export const massageSectionActionsRowClass = "flex flex-wrap items-center gap-2 sm:gap-3";

/** แผงหน้ารวม QR — โทนเดียว ไม่ซ้อนกับกรอบพรีวิวหนัก */
export const massageQrHubPanelClass =
  `min-w-0 overflow-hidden ${massageCardLargeRadiusClass} border border-white/45 bg-gradient-to-br from-white/48 via-white/32 to-indigo-50/[0.12] p-5 shadow-[0_18px_44px_-30px_rgba(30,27,75,0.28)] backdrop-blur-md sm:p-7 md:p-8`;

/** รูปโปสเตอร์ในหน้า QR hub — ไม่ใส่แหวนขาวหนา (ลดความรู้สึกการ์ดซ้อน) */
export const massageQrHubPreviewImgClass =
  "relative z-[1] mx-auto h-auto w-full max-w-[300px] rounded-[1.25rem] shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)] sm:max-w-[340px] sm:rounded-[2rem]";

/** แถบปุ่มเครื่องมือในหน้า QR */
export const massageQrHubToolbarClass =
  `${massageCardSurfaceRadiusClass} flex flex-wrap gap-2 border border-white/45 bg-white/30 p-2.5 backdrop-blur-sm`;

/** การ์ดสถิติย่อยใต้แดชบอร์ด */
export const massageStatCardClass =
  `flex min-h-[100px] flex-col justify-center ${massageCardSurfaceRadiusClass} border border-[#e8e6f4]/80 bg-white p-4 shadow-sm`;

/** หัวหน้าแพ็กเกจ/สมาชิก — พื้นไล่สีนุ่ม */
export const massageOffersHubHeaderShellClass =
  `${massageCardSurfaceRadiusClass} border border-white/60 bg-gradient-to-br from-[#f5f3ff] via-white to-[#ecfdf5]/40 p-4 shadow-[0_14px_44px_-30px_rgba(79,70,229,0.2)] sm:p-5`;

/** แท็บแบ่งแพ็กเกจ / สมาชิก — กรอบชั้นเดียว */
export const massageOffersTabSegmentShellClass =
  `${massageCardSurfaceRadiusClass} flex shrink-0 items-center gap-1 border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-[#f0fdfa]/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]`;

/** การ์ดแถวในหน้าแพ็กเกจ/สมาชิก — เฉดขาวถึงม่วงอมฟ้าอ่อน (padding แนวนอนตามมาตรฐานการ์ดย่อย) */
export const massageOffersListRowCardClass =
  `${massageCardSurfaceRadiusClass} relative overflow-hidden border border-[#e8e6f4]/90 bg-gradient-to-br from-white via-white to-[#faf9ff]/95 ${massageCardBodyPaddingXClass} py-3 shadow-[0_8px_26px_-18px_rgba(91,97,255,0.16)] transition-[box-shadow,border-color] duration-300 sm:py-2.5 hover:border-[#d4cff7]/95 hover:shadow-[0_14px_36px_-22px_rgba(79,70,229,0.18)]`;

/** สถานะว่างแพ็กเกจ/สมาชิก — เส้นประ + ไล่สีพื้น */
export const massageOffersEmptyStateClass =
  `${massageCardSurfaceRadiusClass} border border-dashed border-[#d4cff7]/75 bg-gradient-to-b from-[#faf9ff] via-white to-[#f5f3ff]/45 ${massageCardBodyPaddingXClass} py-10`;

/** แถบกรอง/นับรายการสมาชิก */
export const massageOffersFilterBarClass =
  `${massageCardSurfaceRadiusClass} border border-[#e8e6f4]/85 bg-gradient-to-r from-[#faf9ff]/95 via-white to-[#f0fdf9]/35 px-3 py-2.5 shadow-sm sm:px-4`;

/** หัวหน้าหน้าการเงิน — โทนเดียวกับแพ็กเกจ/สมาชิก */
export const massageFinanceHubHeaderShellClass = massageOffersHubHeaderShellClass;

// --- Modal (พอร์ทัลที่ document.body — กึ่งกลางจอ + safe area + z เหนือ dock) ---

const massageModalMaxHeightClass =
  "max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top,0px))-max(0.75rem,env(safe-area-inset-bottom,0px)))] sm:max-h-[calc(100dvh-2rem)]";

const massageModalPanelScrollableShell =
  `w-full min-h-0 touch-pan-y overflow-y-auto overscroll-y-contain ${massageCardSurfaceRadiusClass} border border-slate-200 bg-white shadow-2xl [-webkit-overflow-scrolling:touch]`;

/** พื้นหลังโมดัลทั่วไป (โทนเดียวกับ「ช่างที่บันทึก」) */
export const massageModalBackdropClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** คู่มือ — พื้นเข้มขึ้นเล็กน้อย */
export const massageModalBackdropMutedClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** พรีวิวรูปเต็มจอ */
export const massageModalBackdropImagePreviewClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** โอเวอร์เลย์กล้องถ่ายสลิป (เหนือ dock) */
export const massageModalCameraBackdropClass =
  "fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-black/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4 sm:pt-4";

/** การ์ดโมดัลเลื่อนได้ — max-w-md */
export const massageModalPanelMdClass = `${massageModalMaxHeightClass} ${massageModalPanelScrollableShell} max-w-md`;

/** การ์ดโมดัลเลื่อนได้ — max-w-lg */
export const massageModalPanelLgClass = `${massageModalMaxHeightClass} ${massageModalPanelScrollableShell} max-w-lg`;

/** คู่มือ — หัวติดบน เนื้อหาเลื่อนใน */
export const massageModalPanel2xlFlexColClass = `${massageModalMaxHeightClass} flex w-full max-w-2xl min-h-0 flex-col overflow-hidden ${massageCardSurfaceRadiusClass} border border-slate-200 bg-white shadow-2xl`;

export const massageModalHeaderClass =
  "flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4";

export const massageModalTitleClass = "text-lg font-bold text-[#2e2a58]";

export const massageModalSubtitleClass = "mt-1 text-xs text-[#66638c]";

export const massageModalCloseBtnClass =
  "shrink-0 rounded-[1.25rem] px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800";

/** ปิดพรีวิวรูป — เว้น safe area */
export const massageModalImagePreviewCloseBtnClass =
  "absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] rounded-[1.25rem] bg-white/90 px-3 py-1 text-sm font-semibold text-[#2e2a58] shadow";

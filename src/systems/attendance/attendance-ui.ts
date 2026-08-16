/**
 * โทนการ์ด/แผงโมดูลเช็คอิน — แนวโรงแรม (glass · มุมมน · ไล่สี)
 */

export const attendanceCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 sm:p-4";

export const attendancePanelClass =
  "overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/55 via-indigo-50/30 to-violet-100/25 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-5";

export const attendanceFilterBarClass =
  "grid grid-cols-1 gap-3 rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-white/70 via-[#faf9ff]/90 to-indigo-50/40 p-4 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.22)] ring-1 ring-inset ring-white/50 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-12 lg:items-end";

export const attendanceEmptyStateClass =
  "rounded-[1.5rem] border border-dashed border-[#d8d6ec]/90 bg-white/40 py-10 text-center text-sm font-medium text-[#66638c] backdrop-blur-sm";

export const attendanceEmptyStateLargeClass =
  "rounded-[1.5rem] border border-dashed border-[#d8d6ec]/90 bg-white/40 py-10 text-center text-sm font-medium text-[#66638c] backdrop-blur-sm";

export const attendanceInsetClass =
  "rounded-[1rem] border border-white/55 bg-white/50 p-4 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm";

export const attendanceStepBoxClass =
  "mt-6 rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-white/70 via-indigo-50/20 to-violet-50/30 px-4 py-4 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.2)] backdrop-blur-xl";

export const attendanceSectionTitleClass = "text-sm font-black tracking-tight text-[#1e1b4b]";

export const attendanceLabelClass = "text-xs font-bold text-[#2e2a58]";

export const attendanceLabelMutedClass = "text-xs font-semibold text-[#66638c]";

/** ปุ่มรอง (ค้นหา / outline) */
export const attendanceSecondaryBtnClass =
  "min-h-[44px] rounded-[1rem] border border-[#4d47b6]/28 bg-[#ecebff]/90 px-4 py-2.5 text-sm font-bold text-[#4d47b6] touch-manipulation shadow-sm hover:bg-[#e4e1ff] sm:w-auto sm:min-h-0";

export const attendanceOutlineBtnClass =
  "rounded-[1rem] border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-50";

export const attendancePosterPreviewShellClass =
  "overflow-x-auto rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-[#f4f2ff]/70 via-white/50 to-indigo-50/40 p-6 backdrop-blur-xl";

/** ปุ่มคัดลอกลิงก์ / ทางเลือกรอง */
export const attendanceLinkActionBtnClass =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[1rem] border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-50 sm:min-h-0";

export const attendanceFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-3.5 py-1.5 text-[11px] font-black text-white shadow-md sm:px-4 sm:py-2 sm:text-xs"
    : "rounded-full border border-white/60 bg-white/50 px-3.5 py-1.5 text-[11px] font-black text-[#66638c] hover:bg-white/80 sm:px-4 sm:py-2 sm:text-xs";

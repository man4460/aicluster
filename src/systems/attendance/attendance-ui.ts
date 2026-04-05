/**
 * โทนการ์ด/แผงโมดูลเช็คอิน — ให้สอดคล้อง AttendanceShell + appDashboardSectionVioletClass / dashboard-tokens
 * สีหลัก: หัวข้อ #2e2a58, รอง #66638c, ขอบ/แหวน #e8e6fc / #e1e3ff, เน้น #4d47b6 / #ecebff
 */

export const attendanceCardClass =
  "rounded-xl border border-[#e1e3ff]/90 bg-white p-2.5 shadow-sm ring-1 ring-[#e8e6fc]/50 sm:p-3";

export const attendancePanelClass =
  "rounded-2xl border border-[#e8e6fc]/80 bg-white p-4 shadow-sm sm:p-5";

export const attendanceFilterBarClass =
  "grid grid-cols-1 gap-3 rounded-2xl border border-[#e8e6fc]/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-12 lg:items-end";

export const attendanceEmptyStateClass =
  "rounded-xl border border-[#e8e6fc]/80 bg-white py-10 text-center text-sm text-[#66638c] shadow-sm ring-1 ring-[#e8e6fc]/40";

export const attendanceEmptyStateLargeClass =
  "rounded-2xl border border-[#e8e6fc]/80 bg-white py-10 text-center text-sm text-[#66638c] shadow-sm";

export const attendanceInsetClass =
  "rounded-xl border border-[#e8e6fc]/70 bg-[#faf9ff]/90 p-4";

export const attendanceStepBoxClass =
  "mt-6 rounded-2xl border border-[#e8e6fc]/80 bg-white px-4 py-4 shadow-sm";

export const attendanceSectionTitleClass = "text-sm font-bold text-[#2e2a58]";

export const attendanceLabelClass = "text-xs font-semibold text-[#2e2a58]";

export const attendanceLabelMutedClass = "text-xs font-semibold text-[#66638c]";

/** ปุ่มรอง (ค้นหา / outline) */
export const attendanceSecondaryBtnClass =
  "min-h-[44px] rounded-xl border border-[#4d47b6]/28 bg-[#ecebff] px-4 py-2.5 text-sm font-semibold text-[#4d47b6] touch-manipulation hover:bg-[#e4e1ff] sm:w-auto sm:min-h-0";

export const attendanceOutlineBtnClass =
  "rounded-xl border border-[#d8d6ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#2e2a58] shadow-sm hover:bg-[#faf9ff] disabled:opacity-50";

export const attendancePosterPreviewShellClass =
  "overflow-x-auto rounded-2xl border border-[#e8e6fc]/80 bg-[#f4f2ff]/50 p-6";

/** ปุ่มคัดลอกลิงก์ / ทางเลือกรอง */
export const attendanceLinkActionBtnClass =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[#d8d6ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#2e2a58] hover:bg-[#faf9ff] disabled:opacity-50 sm:min-h-0";

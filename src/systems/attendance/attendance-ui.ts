/**
 * โทนการ์ด/แผงโมดูลเช็คอิน — glass · มุมมน · ไล่สีตามหมวด
 */

import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

export type AttendancePanelTone = "violet" | "sky" | "emerald" | "amber" | "rose" | "fuchsia";

const PANEL_TONE: Record<
  AttendancePanelTone,
  { shell: string; badge: string; accent: string; inset: string }
> = {
  violet: {
    shell:
      "border-violet-200/70 bg-gradient-to-br from-white/75 via-violet-50/45 to-fuchsia-50/30",
    badge: "bg-gradient-to-br from-[#5b61ff] to-[#8b5cf6] text-white shadow-violet-500/25",
    accent: "from-[#0000BF] via-[#8b5cf6] to-[#ec4899]",
    inset: "border-violet-100/90 bg-gradient-to-br from-white/80 via-violet-50/30 to-white/60",
  },
  sky: {
    shell: "border-sky-200/70 bg-gradient-to-br from-white/75 via-sky-50/50 to-cyan-50/30",
    badge: "bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sky-500/25",
    accent: "from-sky-500 via-cyan-400 to-teal-400",
    inset: "border-sky-100/90 bg-gradient-to-br from-white/80 via-sky-50/35 to-white/60",
  },
  emerald: {
    shell:
      "border-emerald-200/70 bg-gradient-to-br from-white/75 via-emerald-50/45 to-teal-50/25",
    badge: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/25",
    accent: "from-emerald-500 via-teal-400 to-cyan-400",
    inset: "border-emerald-100/90 bg-gradient-to-br from-white/80 via-emerald-50/35 to-white/60",
  },
  amber: {
    shell: "border-amber-200/70 bg-gradient-to-br from-white/75 via-amber-50/50 to-orange-50/30",
    badge: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25",
    accent: "from-amber-400 via-orange-400 to-rose-400",
    inset: "border-amber-100/90 bg-gradient-to-br from-white/80 via-amber-50/35 to-white/60",
  },
  rose: {
    shell: "border-rose-200/70 bg-gradient-to-br from-white/75 via-rose-50/45 to-pink-50/30",
    badge: "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-rose-500/25",
    accent: "from-rose-500 via-pink-400 to-fuchsia-400",
    inset: "border-rose-100/90 bg-gradient-to-br from-white/80 via-rose-50/35 to-white/60",
  },
  fuchsia: {
    shell:
      "border-fuchsia-200/70 bg-gradient-to-br from-white/75 via-fuchsia-50/45 to-violet-50/30",
    badge: "bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-fuchsia-500/25",
    accent: "from-fuchsia-500 via-violet-500 to-[#5b61ff]",
    inset: "border-fuchsia-100/90 bg-gradient-to-br from-white/80 via-fuchsia-50/35 to-white/60",
  },
};

/** โทนจุดเช็ควนตามลำดับ */
export const ATTENDANCE_LOCATION_TONES: AttendancePanelTone[] = [
  "emerald",
  "sky",
  "amber",
  "fuchsia",
  "rose",
];

export function attendancePanelTone(tone: AttendancePanelTone = "violet") {
  return PANEL_TONE[tone];
}

export const attendanceCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/30 to-violet-100/25 p-2.5 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 sm:p-3";

export const attendancePanelClass =
  "relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/55 via-indigo-50/30 to-violet-100/25 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-5";

export function attendancePanelToneClass(tone: AttendancePanelTone = "violet") {
  const t = PANEL_TONE[tone];
  return cn(
    "relative overflow-hidden rounded-[2rem] border p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:p-5",
    t.shell,
  );
}

export function attendancePanelAccentBarClass(tone: AttendancePanelTone = "violet") {
  return cn("h-1.5 w-full rounded-full bg-gradient-to-r", PANEL_TONE[tone].accent);
}

export function attendanceIconBadgeClass(tone: AttendancePanelTone = "violet") {
  return cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-lg",
    PANEL_TONE[tone].badge,
  );
}

export function attendanceInsetToneClass(tone: AttendancePanelTone = "violet") {
  return cn(
    "rounded-[1.25rem] border p-3.5 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur-sm sm:p-4",
    PANEL_TONE[tone].inset,
  );
}

export const attendanceFilterBarClass =
  "grid grid-cols-1 gap-3 rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-white/70 via-[#faf9ff]/90 to-indigo-50/40 p-4 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.22)] ring-1 ring-inset ring-white/50 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-12 lg:items-end";

export const attendanceEmptyStateClass =
  "rounded-[1.5rem] border border-dashed border-[#d8d6ec]/90 bg-white/40 py-10 text-center text-sm font-medium text-[#66638c] backdrop-blur-sm";

export const attendanceEmptyStateLargeClass =
  "rounded-[1.5rem] border border-dashed border-[#d8d6ec]/90 bg-white/40 py-10 text-center text-sm font-medium text-[#66638c] backdrop-blur-sm";

export const attendanceInsetClass =
  "rounded-[1.25rem] border border-white/55 bg-white/55 p-3.5 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:p-4";

export const attendanceStepBoxClass =
  "mt-6 rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-white/70 via-indigo-50/20 to-violet-50/30 px-4 py-4 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.2)] backdrop-blur-xl";

export const attendanceSectionTitleClass =
  "text-sm font-black tracking-tight text-[#1e1b4b]";

export const attendanceLabelClass = "text-xs font-bold text-[#2e2a58]";

export const attendanceLabelMutedClass = "text-xs font-semibold text-[#66638c]";

export const attendanceFieldClass =
  "mt-1 w-full min-h-[44px] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm font-semibold text-[#2e2a58] outline-none shadow-sm backdrop-blur-sm transition focus:border-[#4d47b6]/45 focus:ring-2 focus:ring-[#5b61ff]/20";

/** ปุ่มรอง (ค้นหา / outline) */
export const attendanceSecondaryBtnClass =
  "min-h-[44px] rounded-[1rem] border border-[#4d47b6]/28 bg-[#ecebff]/90 px-4 py-2.5 text-sm font-bold text-[#4d47b6] touch-manipulation shadow-sm hover:bg-[#e4e1ff] sm:w-auto sm:min-h-0";

export const attendanceOutlineBtnClass =
  "rounded-[1rem] border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-50";

export const attendancePrimaryBtnClass = cn(
  "inline-flex min-h-[44px] items-center justify-center rounded-[1rem] px-5 py-2.5 text-sm font-black text-white shadow-md disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

export const attendancePosterPreviewShellClass =
  "overflow-x-auto rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-[#f4f2ff]/70 via-white/50 to-indigo-50/40 p-6 backdrop-blur-xl";

/** ปุ่มคัดลอกลิงก์ / ทางเลือกรอง */
export const attendanceLinkActionBtnClass =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[1rem] border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-50 sm:min-h-0";

export const attendanceFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-3.5 py-1.5 text-[11px] font-black text-white shadow-md sm:px-4 sm:py-2 sm:text-xs"
    : "rounded-full border border-white/60 bg-white/50 px-3.5 py-1.5 text-[11px] font-black text-[#66638c] hover:bg-white/80 sm:px-4 sm:py-2 sm:text-xs";

export const attendanceStatCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/25 to-violet-50/30 p-3 shadow-[0_12px_28px_-20px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:p-3.5";

export const attendanceRosterAccentBarClass = cn(
  "mb-2.5 h-1 w-full rounded-full",
  appDashboardBrandGradientBarClass,
);

export const attendanceZoneChipFaceClass =
  "rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 ring-1 ring-emerald-200/70";

export const attendanceZoneChipFaceIdleClass =
  "rounded-md bg-[#f4f2ff] px-2 py-0.5 text-[10px] font-semibold text-[#66638c] ring-1 ring-[#e8e6fc]";

export const attendanceZoneChipFpClass =
  "rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200/70";

export const attendanceZoneChipActiveClass =
  "shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 ring-1 ring-emerald-200/70";

export const attendanceZoneChipInactiveClass =
  "shrink-0 rounded-md bg-[#f4f2ff] px-2 py-0.5 text-[10px] font-semibold text-[#66638c] ring-1 ring-[#e8e6fc]";

export const attendanceAddLocationDashedClass =
  "rounded-[2rem] border border-dashed border-[#5b61ff]/35 bg-gradient-to-br from-[#ecebff]/60 via-white/50 to-fuchsia-50/40 p-5 text-center shadow-sm backdrop-blur-sm";

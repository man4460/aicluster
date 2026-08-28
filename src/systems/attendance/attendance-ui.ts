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

/** การ์ดแถวในแดชบอร์ด «เช็คเข้า/ออกวันนี้» — ไม่ clip ป้ายด้านล่าง */
export const attendanceDashboardTodayRowClass =
  "relative rounded-[1.25rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/30 to-violet-100/25 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:p-3.5";

export const attendanceDashboardTodayStatusChipClass =
  "inline-flex min-h-[22px] items-center rounded-md px-2 py-0.5 text-[10px] font-bold leading-normal ring-1";

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

/** พื้นฐาน hover/active สำหรับ `<button>` / `<Link>` ที่กดได้ในโมดูลเช็คอิน */
export const attendanceInteractiveHoverClass =
  "cursor-pointer transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md active:scale-[0.97] active:translate-y-0 active:shadow-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:scale-100";

/** chip / pill ที่เป็น `<button>` (กรอง · สลับสถานะ) */
export const attendanceChipButtonHoverClass =
  "cursor-pointer transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-sm active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

/** ลิงก์ข้อความที่กดได้ (เช่น ล้างกรอง) */
export const attendanceTextLinkBtnClass = cn(
  attendanceInteractiveHoverClass,
  "rounded-md px-1 py-0.5 font-bold underline decoration-[#d8d6ec] underline-offset-2 hover:bg-[#ecebff]/60 hover:text-[#4d47b6] hover:decoration-[#5b61ff]/40",
);

/** ปุ่มรอง (ค้นหา / outline) */
export const attendanceSecondaryBtnClass = cn(
  "min-h-[44px] rounded-[1rem] border border-[#4d47b6]/28 bg-[#ecebff]/90 px-4 py-2.5 text-sm font-bold text-[#4d47b6] touch-manipulation shadow-sm sm:w-auto sm:min-h-0",
  attendanceInteractiveHoverClass,
  "hover:border-[#4d47b6]/40 hover:bg-[#e4e1ff] hover:shadow-[#5b61ff]/12",
);

export const attendanceOutlineBtnClass = cn(
  "rounded-[1rem] border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm backdrop-blur-sm",
  attendanceInteractiveHoverClass,
  "hover:border-white/80 hover:bg-white",
);

export const attendancePrimaryBtnClass = cn(
  "inline-flex min-h-[44px] items-center justify-center rounded-[1rem] px-5 py-2.5 text-sm font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
  attendanceInteractiveHoverClass,
  "hover:brightness-110 hover:shadow-lg hover:shadow-[#5b61ff]/25",
);

export const attendancePosterPreviewShellClass =
  "overflow-x-auto rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-[#f4f2ff]/70 via-white/50 to-indigo-50/40 p-4 backdrop-blur-xl sm:p-5 lg:flex lg:min-h-0 lg:justify-center lg:p-4";

/** โซน QR — ซ้ายคำอธิบาย/ปุ่ม · ขวาตัวอย่างโปสเตอร์ (เดสก์ท็อป) */
export const attendanceQrPosterSplitClass =
  "grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start";

/** แถบปุ่มดาวน์โหลด/คัดลอก QR */
export const attendanceQrToolbarClass =
  "flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-[#e8e6fc]/90 bg-[#f8f7ff]/60 p-1.5 lg:w-full lg:flex-col lg:items-stretch lg:p-2";

export const attendanceQrToolbarBtnClass =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold touch-manipulation sm:min-h-[40px] sm:px-4 lg:w-full lg:justify-center";

/** ปุ่มคัดลอกลิงก์ / ทางเลือกรอง */
export const attendanceLinkActionBtnClass = cn(
  "inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[1rem] border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-[#2e2a58] shadow-sm backdrop-blur-sm sm:min-h-0",
  attendanceInteractiveHoverClass,
  "hover:border-white/80 hover:bg-white",
);

export const attendanceFilterChipClass = (active: boolean) =>
  cn(
    attendanceChipButtonHoverClass,
    "rounded-full px-3.5 py-1.5 text-[11px] font-black sm:px-4 sm:py-2 sm:text-xs",
    active
      ? "border border-[#5b61ff]/40 bg-[#5b61ff] text-white shadow-md hover:brightness-110 hover:shadow-[#5b61ff]/30"
      : "border border-white/60 bg-white/50 text-[#66638c] hover:border-[#5b61ff]/25 hover:bg-white/90 hover:text-[#4d47b6]",
  );

/** ปุ่มไอคอนแก้ไขในแถวรายการ */
export const attendanceRowEditIconButtonClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/80 text-[#5b61ff]",
  attendanceInteractiveHoverClass,
  "hover:border-[#5b61ff]/35 hover:bg-white hover:text-[#4d47b6] hover:shadow-[#5b61ff]/15",
);

/** ปุ่มไอคอนลบในแถวรายการ */
export const attendanceRowRemoveIconButtonClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600",
  attendanceInteractiveHoverClass,
  "hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 hover:shadow-rose-200/50",
);

export const attendanceStatCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/25 to-violet-50/30 p-3 shadow-[0_12px_28px_-20px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:p-3.5";

export const attendanceRosterAccentBarClass = cn(
  "mb-2.5 h-1 w-full rounded-full",
  appDashboardBrandGradientBarClass,
);

export const attendanceZoneChipFaceClass =
  "inline-flex min-h-9 max-w-full items-center truncate rounded-md bg-emerald-100 px-2 text-[10px] font-semibold text-emerald-900 ring-1 ring-emerald-200/70 sm:min-h-8";

export const attendanceZoneChipFaceIdleClass =
  "inline-flex min-h-9 max-w-full items-center truncate rounded-md bg-[#f4f2ff] px-2 text-[10px] font-semibold text-[#66638c] ring-1 ring-[#e8e6fc] sm:min-h-8";

export const attendanceZoneChipFpClass =
  "inline-flex min-h-9 items-center rounded-md bg-sky-100 px-2 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200/70 sm:min-h-8";

export const attendanceZoneChipActiveClass =
  "inline-flex min-h-9 shrink-0 items-center rounded-md bg-emerald-100 px-2 text-[10px] font-semibold text-emerald-900 ring-1 ring-emerald-200/70 sm:min-h-8";

export const attendanceZoneChipInactiveClass =
  "inline-flex min-h-9 shrink-0 items-center rounded-md bg-[#f4f2ff] px-2 text-[10px] font-semibold text-[#66638c] ring-1 ring-[#e8e6fc] sm:min-h-8";

/** ชip สลับสถานะ — ใช้กับ `<button>` เท่านั้น (มี hover) */
export const attendanceZoneChipActiveBtnClass = cn(
  attendanceZoneChipActiveClass,
  attendanceChipButtonHoverClass,
  "hover:bg-emerald-200/85 hover:ring-2 hover:ring-emerald-300/50",
);

export const attendanceZoneChipInactiveBtnClass = cn(
  attendanceZoneChipInactiveClass,
  attendanceChipButtonHoverClass,
  "hover:bg-white hover:text-[#4d47b6] hover:ring-2 hover:ring-[#5b61ff]/20",
);

/** แถวเมตาในการ์ดรายชื่อ — label คอลัมน์เดียวกัน · ปุ่ม/ชip สูงเท่ากัน */
export const attendanceRosterMetaRowClass =
  "grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-2 sm:grid-cols-[3rem_minmax(0,1fr)]";

export const attendanceRosterMetaLabelClass =
  "text-[10px] font-semibold leading-tight text-[#66638c]";

export const attendanceRosterMetaActionsClass =
  "flex min-w-0 flex-wrap items-center gap-1.5";

export const attendanceRosterMetaControlClass = cn(
  "inline-flex min-h-9 shrink-0 items-center justify-center rounded-md px-2.5 text-[10px] font-bold touch-manipulation sm:min-h-8",
  attendanceInteractiveHoverClass,
);

export const attendanceRosterMetaBtnEmeraldClass = cn(
  attendanceRosterMetaControlClass,
  "border border-emerald-200/80 bg-emerald-50/90 text-emerald-800 hover:border-emerald-300/90 hover:bg-emerald-100/90 hover:shadow-emerald-200/40",
);

export const attendanceRosterMetaBtnVioletClass = cn(
  attendanceRosterMetaControlClass,
  "border border-[#4d47b6]/25 bg-[#ecebff]/90 text-[#4d47b6] hover:border-[#4d47b6]/40 hover:bg-[#e4e1ff] hover:shadow-[#5b61ff]/15",
);

export const attendanceRosterMetaBtnGreenClass = cn(
  attendanceRosterMetaControlClass,
  "border border-emerald-600/35 bg-emerald-50 text-emerald-900 hover:border-emerald-600/50 hover:bg-emerald-100/90 hover:shadow-emerald-200/35",
);

export const attendanceRosterMetaBtnMutedClass = cn(
  attendanceRosterMetaControlClass,
  "border border-[#e8e6fc] bg-white/90 text-[#66638c] hover:border-[#d8d6ec] hover:bg-white hover:text-[#2e2a58]",
);

export const attendanceRosterMetaHintClass =
  "inline-flex min-h-9 items-center text-[10px] font-semibold text-[#9490c0] sm:min-h-8";

export const attendanceRosterMetaInputClass =
  "app-input h-9 w-[4.25rem] shrink-0 rounded-md border-sky-100 px-1.5 py-0 text-center text-xs tabular-nums touch-manipulation sm:h-8 sm:w-16";

/** การ์ดแถวรายชื่อ — แนว barber/educare (avatar ซ้าย · toolbar ขวา) */
export const attendanceListRowCardClass = cn(
  attendanceCardClass,
  "flex flex-col gap-2",
);

export const attendanceIconToolbarGroupClass =
  "flex items-center gap-0.5 rounded-[1.25rem] border border-[#e8e6fc] bg-[#f8f7ff]/90 p-0.5";

export const attendanceRosterInactiveBadgeClass =
  "shrink-0 rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold leading-none text-amber-900";

export const attendanceRosterFooterRowClass =
  "flex w-full flex-wrap items-end gap-2 border-t border-slate-100 pt-2";

export const attendanceRosterSelectClass =
  "app-input mt-0.5 min-h-[40px] w-full rounded-lg px-2.5 py-1.5 text-sm touch-manipulation sm:min-h-0 sm:rounded-xl sm:px-3 sm:py-2";

export const attendanceAddLocationDashedClass =
  "rounded-[2rem] border border-dashed border-[#5b61ff]/35 bg-gradient-to-br from-[#ecebff]/60 via-white/50 to-fuchsia-50/40 p-5 text-center shadow-sm backdrop-blur-sm";

export const attendanceKioskPageShellClass =
  "fixed inset-0 z-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden overscroll-none";

export const attendanceKioskPageInnerClass =
  "mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]";

/** โซนหลักคีออสก์ — จัดกลางจอแนวตั้ง · ไม่เลื่อน */
export const attendanceKioskCenterShellClass =
  "flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 self-stretch overflow-hidden py-1";

export const attendanceKioskStepBoxClass =
  "w-full max-w-md min-h-0 overflow-hidden rounded-[1.5rem] border border-white/55 bg-gradient-to-br from-white/70 via-indigo-50/20 to-violet-50/30 px-4 py-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.2)] backdrop-blur-xl sm:py-4";

export const attendanceKioskCompactClockClass =
  "w-full max-w-md rounded-2xl border border-[#0000BF]/15 bg-white/90 px-4 py-3 text-center shadow-sm";

export type AttendanceFacePunchIntent = "check_in" | "check_out";

/** กรอบกล้องคีออสก์ — เข้าเขียว · ออกแดง */
export function attendanceFacePunchCameraShellClass(
  intent: AttendanceFacePunchIntent | null,
  options?: { kiosk?: boolean },
) {
  return cn(
    "relative space-y-3 rounded-2xl border-[3px] bg-black p-2 shadow-lg",
    options?.kiosk ? "mt-2" : "mt-3",
    intent === "check_out"
      ? "border-rose-500 shadow-rose-500/25 ring-2 ring-rose-400/35"
      : "border-emerald-500 shadow-emerald-500/25 ring-2 ring-emerald-400/35",
  );
}

export function attendanceFacePunchCameraVideoClass(
  intent: AttendanceFacePunchIntent | null,
  options?: { kiosk?: boolean },
) {
  return cn(
    "mx-auto w-full rounded-xl bg-black object-cover",
    options?.kiosk ? "aspect-[3/4] max-h-[40dvh] max-w-sm" : "aspect-[3/4] max-w-xs",
    intent === "check_out" ? "ring-2 ring-rose-400/50" : "ring-2 ring-emerald-400/50",
  );
}

export function attendanceFacePunchCameraPlaceholderClass(
  intent: AttendanceFacePunchIntent | null,
  options?: { kiosk?: boolean },
) {
  return cn(
    "mx-auto flex w-full items-center justify-center rounded-xl px-4 text-center text-xs font-medium text-white/80",
    options?.kiosk ? "aspect-[3/4] max-h-[40dvh] max-w-sm" : "aspect-[3/4] max-w-xs",
    intent === "check_out" ? "bg-rose-950/80" : "bg-emerald-950/80",
  );
}

export function attendanceFacePunchActionButtonClass(intent: AttendanceFacePunchIntent | null) {
  return cn(
    "mt-4 min-h-[52px] w-full rounded-2xl py-3.5 text-base font-bold text-white shadow-md disabled:opacity-45",
    intent === "check_out"
      ? "bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-600/25"
      : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/25",
  );
}

/** กล่องแจ้งผลสแกนใบหน้า — เข้าเขียว · ออกแดง */
export function attendanceFacePunchFeedbackClass(
  intent: AttendanceFacePunchIntent,
  variant: "success" | "error",
) {
  if (intent === "check_out") {
    return cn(
      "rounded-2xl border-[3px] px-4 py-3.5 text-center shadow-md",
      variant === "success"
        ? "border-rose-500 bg-gradient-to-br from-rose-50 to-red-50/90 text-rose-950 ring-2 ring-rose-400/35"
        : "border-rose-500 bg-gradient-to-br from-rose-50/95 to-orange-50/70 text-rose-950 ring-2 ring-rose-400/30",
    );
  }
  return cn(
    "rounded-2xl border-[3px] px-4 py-3.5 text-center shadow-md",
    variant === "success"
      ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50/90 text-emerald-950 ring-2 ring-emerald-400/35"
      : "border-emerald-500 bg-gradient-to-br from-amber-50/90 to-orange-50/60 text-rose-950 ring-2 ring-emerald-400/30",
  );
}

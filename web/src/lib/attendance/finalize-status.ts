export type AttendanceSummaryStatusName =
  | "ON_TIME"
  | "LATE"
  | "EARLY_LEAVE"
  | "LATE_AND_EARLY";

export function finalizedAttendanceStatus(
  lateCheckIn: boolean,
  earlyCheckOut: boolean,
): AttendanceSummaryStatusName {
  if (lateCheckIn && earlyCheckOut) return "LATE_AND_EARLY";
  if (lateCheckIn) return "LATE";
  if (earlyCheckOut) return "EARLY_LEAVE";
  return "ON_TIME";
}

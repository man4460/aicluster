export type AttendanceDashboardLogRow = {
  id: number;
  guestPhone: string | null;
  guestName: string | null;
  publicVisitorKind: string | null;
  actorUsername: string | null;
  actorFullName: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  lateCheckIn: boolean;
  earlyCheckOut: boolean;
  checkInFacePhotoUrl: string | null;
  checkInLocationId: number | null;
  checkInLocationName: string | null;
  checkInBranchName: string | null;
  checkInBranchCode: string | null;
  checkOutLocationId: number | null;
  checkOutLocationName: string | null;
  checkOutBranchName: string | null;
  checkOutBranchCode: string | null;
  note: string | null;
};

export type AttendanceDashboardStats = {
  checkedIn: number;
  late: number;
  remaining: number;
  stillWorking: number;
  checkedOut: number;
};

export type AttendanceDashboardSsePatch = {
  type: "patch";
  at: string;
  stats: AttendanceDashboardStats;
  log: AttendanceDashboardLogRow;
};

export type AttendanceDashboardSseHello = {
  type: "hello";
  at: string;
};

export type AttendanceDashboardSseEvent = AttendanceDashboardSseHello | AttendanceDashboardSsePatch;

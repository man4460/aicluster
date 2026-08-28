import type { AttendanceDashboardLogRow } from "@/lib/attendance/dashboard-types";

type LogWithActor = {
  id: number;
  guestPhone: string | null;
  guestName: string | null;
  publicVisitorKind: string | null;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: string;
  lateCheckIn: boolean;
  earlyCheckOut: boolean;
  checkInFacePhotoUrl: string | null;
  checkInLocationId?: number | null;
  checkOutLocationId?: number | null;
  note: string | null;
  actor?: { username: string | null; fullName: string | null } | null;
  checkInLocation?: { id: number; name: string; branch?: { id: number; name: string; code: string } | null } | null;
  checkOutLocation?: { id: number; name: string; branch?: { id: number; name: string; code: string } | null } | null;
};

export function mapAttendanceLogRow(r: LogWithActor): AttendanceDashboardLogRow {
  return {
    id: r.id,
    guestPhone: r.guestPhone,
    guestName: r.guestName,
    publicVisitorKind: r.publicVisitorKind,
    actorUsername: r.actor?.username ?? null,
    actorFullName: r.actor?.fullName ?? null,
    checkInTime: r.checkInTime?.toISOString() ?? null,
    checkOutTime: r.checkOutTime?.toISOString() ?? null,
    status: r.status,
    lateCheckIn: r.lateCheckIn,
    earlyCheckOut: r.earlyCheckOut,
    checkInFacePhotoUrl: r.checkInFacePhotoUrl,
    checkInLocationId: r.checkInLocation?.id ?? r.checkInLocationId ?? null,
    checkInLocationName: r.checkInLocation?.name ?? null,
    checkInBranchName: r.checkInLocation?.branch?.name ?? null,
    checkInBranchCode: r.checkInLocation?.branch?.code ?? null,
    checkOutLocationId: r.checkOutLocation?.id ?? r.checkOutLocationId ?? null,
    checkOutLocationName: r.checkOutLocation?.name ?? null,
    checkOutBranchName: r.checkOutLocation?.branch?.name ?? null,
    checkOutBranchCode: r.checkOutLocation?.branch?.code ?? null,
    note: r.note,
  };
}

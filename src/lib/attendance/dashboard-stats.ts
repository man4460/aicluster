import { bangkokDayStartEnd } from "@/lib/barber/bangkok-day";
import type { AttendanceDashboardStats } from "@/lib/attendance/dashboard-types";
import { prisma } from "@/lib/prisma";

export async function loadAttendanceDashboardStats(
  ownerUserId: string,
  trialSessionId: string,
): Promise<AttendanceDashboardStats> {
  const { start, end } = bangkokDayStartEnd();

  const [todayLogs, rosterTotal, rosterCheckedIn] = await Promise.all([
    prisma.attendanceLog.findMany({
      where: {
        ownerUserId,
        trialSessionId,
        checkInTime: { gte: start, lt: end },
      },
      select: {
        checkOutTime: true,
        lateCheckIn: true,
      },
    }),
    prisma.attendanceRosterEntry.count({
      where: { ownerUserId, trialSessionId, isActive: true },
    }),
    prisma.attendanceLog.count({
      where: {
        ownerUserId,
        trialSessionId,
        checkInTime: { gte: start, lt: end },
        publicVisitorKind: "ROSTER_STAFF",
      },
    }),
  ]);

  const checkedIn = todayLogs.length;
  const late = todayLogs.filter((l) => l.lateCheckIn).length;
  const checkedOut = todayLogs.filter((l) => l.checkOutTime != null).length;

  return {
    checkedIn,
    late,
    remaining: Math.max(rosterTotal - rosterCheckedIn, 0),
    stillWorking: checkedIn - checkedOut,
    checkedOut,
  };
}

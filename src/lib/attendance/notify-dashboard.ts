import { loadAttendanceDashboardStats } from "@/lib/attendance/dashboard-stats";
import { publishAttendanceDashboard } from "@/lib/attendance/dashboard-bus";
import { mapAttendanceLogRow } from "@/lib/attendance/map-attendance-log-row";
import { prisma } from "@/lib/prisma";

/** แจ้งแดชบอร์ดเมื่อมี log เช็คเข้า/ออก — ไม่ throw ขึ้น API */
export function queueAttendanceDashboardNotify(
  ownerUserId: string,
  trialSessionId: string,
  logId: number,
): void {
  void notifyAttendanceDashboardPatch(ownerUserId, trialSessionId, logId).catch((e) => {
    console.error("[attendance dashboard notify]", e);
  });
}

async function notifyAttendanceDashboardPatch(
  ownerUserId: string,
  trialSessionId: string,
  logId: number,
): Promise<void> {
  const row = await prisma.attendanceLog.findFirst({
    where: { id: logId, ownerUserId, trialSessionId },
    include: {
      actor: { select: { username: true, fullName: true } },
      checkInLocation: {
        select: { id: true, name: true, branch: { select: { id: true, name: true, code: true } } },
      },
      checkOutLocation: {
        select: { id: true, name: true, branch: { select: { id: true, name: true, code: true } } },
      },
    },
  });
  if (!row) return;

  const stats = await loadAttendanceDashboardStats(ownerUserId, trialSessionId);

  publishAttendanceDashboard(ownerUserId, {
    type: "patch",
    at: new Date().toISOString(),
    stats,
    log: mapAttendanceLogRow(row),
  });
}

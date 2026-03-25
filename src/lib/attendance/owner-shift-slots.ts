import { prisma } from "@/lib/prisma";
import { formatShiftSlotLabel } from "@/lib/attendance/shift";

/** กะของโลเคชันแรก (ระบบใช้ 1 โลเคชัน) เรียงตาม sort_order */
export async function getOwnerShiftWindowsOrdered(ownerUserId: string) {
  const loc = await prisma.attendanceLocation.findFirst({
    where: { ownerUserId },
    orderBy: { sortOrder: "asc" },
    include: { shifts: { orderBy: { sortOrder: "asc" } } },
  });
  return (loc?.shifts ?? []).map((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    label: formatShiftSlotLabel(s),
  }));
}

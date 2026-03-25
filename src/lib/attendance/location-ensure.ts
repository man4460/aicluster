import { prisma } from "@/lib/prisma";

/** ถ้ายังไม่มีโลเคชัน (DB เก่า) ให้สร้างจากแถว attendance_settings */
export async function ensureAttendanceLocationsFromLegacy(ownerUserId: string): Promise<void> {
  const n = await prisma.attendanceLocation.count({ where: { ownerUserId } });
  if (n > 0) return;

  const s = await prisma.attendanceSettings.findUnique({ where: { ownerUserId } });
  if (!s) return;

  await prisma.attendanceLocation.create({
    data: {
      ownerUserId,
      name: "จุดหลัก",
      allowedLocationLat: s.allowedLocationLat,
      allowedLocationLng: s.allowedLocationLng,
      radiusMeters: s.radiusMeters,
      sortOrder: 0,
      shifts: {
        create: [{ startTime: s.shiftStartTime, endTime: s.shiftEndTime, sortOrder: 0 }],
      },
    },
  });
}

/** เก็บ attendance_settings ให้สอดคล้องจุดแรก (โค้ด/รายงานที่อ่านตารางเดิม) */
export async function syncAttendanceSettingsMirrorFromPrimaryLocation(ownerUserId: string): Promise<void> {
  const row = await prisma.attendanceSettings.findUnique({ where: { ownerUserId } });
  if (!row) return;

  const first = await prisma.attendanceLocation.findFirst({
    where: { ownerUserId },
    orderBy: { sortOrder: "asc" },
    include: { shifts: { orderBy: { sortOrder: "asc" } } },
  });
  if (!first || first.shifts.length === 0) return;

  const sh0 = first.shifts[0];
  await prisma.attendanceSettings.update({
    where: { ownerUserId },
    data: {
      allowedLocationLat: first.allowedLocationLat,
      allowedLocationLng: first.allowedLocationLng,
      radiusMeters: first.radiusMeters,
      shiftStartTime: sh0.startTime,
      shiftEndTime: sh0.endTime,
    },
  });
}

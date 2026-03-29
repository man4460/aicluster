import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** จุดเช็ค + กะ + รายชื่อตัวอย่าง — ใช้ลิงก์สาธารณะได้ทันทีหลังเริ่มทดลอง */
export async function seedAttendanceTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: ownerUserId },
    select: { latitude: true, longitude: true },
  });
  const lat =
    user?.latitude != null && Number.isFinite(user.latitude) ? user.latitude : 13.7563309;
  const lng =
    user?.longitude != null && Number.isFinite(user.longitude) ? user.longitude : 100.5017651;

  await tx.attendanceSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      allowedLocationLat: lat,
      allowedLocationLng: lng,
      radiusMeters: 150,
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
    },
  });

  await tx.attendanceLocation.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "จุดเช็คตัวอย่าง (ทดลอง)",
      allowedLocationLat: lat,
      allowedLocationLng: lng,
      radiusMeters: 150,
      sortOrder: 0,
      shifts: {
        create: [
          { startTime: "09:00", endTime: "13:00", sortOrder: 0 },
          { startTime: "13:00", endTime: "18:00", sortOrder: 1 },
        ],
      },
    },
  });

  await tx.attendanceRosterEntry.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "พนักงานตัวอย่าง",
      phone: "0812345678",
      isActive: true,
      rosterShiftIndex: 0,
    },
  });
}

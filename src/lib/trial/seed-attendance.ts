import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

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
      // ลิงก์ «สแกนใบหน้า» ต้องกดใช้ได้ทันทีตอนทดลอง (ยังต้องลงทะเบียนใบหน้าในรายชื่อก่อนสแกนผ่าน)
      faceCheckInEnabled: true,
    },
  });

  const branch = await tx.attendanceBranch.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "สาขาตัวอย่าง",
      code: "MAIN",
      sortOrder: 0,
    },
  });

  await tx.attendanceLocation.create({
    data: {
      ownerUserId,
      trialSessionId,
      branchId: branch.id,
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

/** ข้อมูลตัวอย่าง scope prod สำหรับบัญชี demo — ข้ามถ้ามีการตั้งค่าแล้ว */
export async function seedAttendanceProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const existing = await db.attendanceSettings.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    select: { id: true, faceCheckInEnabled: true },
  });
  if (existing) {
    if (!existing.faceCheckInEnabled) {
      await db.attendanceSettings.update({
        where: { id: existing.id },
        data: { faceCheckInEnabled: true },
      });
    }
    return;
  }
  await db.$transaction((tx) => seedAttendanceTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE));
}

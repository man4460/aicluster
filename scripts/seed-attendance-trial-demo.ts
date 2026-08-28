import { prisma } from "@/lib/prisma";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { startTrial } from "@/lib/trial/trial-service";

const FALLBACK_TRIAL_EMAILS = ["admin@mawell.local", "user@mawell.local", "user@mawell.local.com"] as const;

const ROSTER_SEEDS = [
  {
    displayName: "สมชาย หัวหน้างาน",
    phone: "0812345001",
    rosterShiftIndex: 0,
    isActive: true,
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    displayName: "สุดา แคชเชียร์",
    phone: "0812345002",
    rosterShiftIndex: 0,
    isActive: true,
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    displayName: "กิตติพงษ์ ฝ่ายผลิต",
    phone: "0812345003",
    rosterShiftIndex: 1,
    isActive: true,
    photoUrl: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    displayName: "อาภา แม่บ้าน",
    phone: "0812345004",
    rosterShiftIndex: 1,
    isActive: true,
    photoUrl: "https://randomuser.me/api/portraits/women/28.jpg",
  },
  {
    displayName: "มานพ พนักงานพาร์ตไทม์",
    phone: "0812345005",
    rosterShiftIndex: 0,
    isActive: false,
    photoUrl: "https://randomuser.me/api/portraits/men/15.jpg",
  },
] as const;

function bangkokDate(dayOffset = 0, hour = 9, minute = 0) {
  const now = new Date();
  const bkkNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  bkkNow.setDate(bkkNow.getDate() + dayOffset);
  bkkNow.setHours(hour, minute, 0, 0);
  return bkkNow;
}

async function ensureAttendanceDemoData(ownerUserId: string, trialSessionId: string) {
  await prisma.attendanceSettings.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
    update: {
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
      allowedLocationLat: 13.7563,
      allowedLocationLng: 100.5018,
      radiusMeters: 180,
    },
    create: {
      ownerUserId,
      trialSessionId,
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
      allowedLocationLat: 13.7563,
      allowedLocationLng: 100.5018,
      radiusMeters: 180,
    },
  });

  const branch = await prisma.attendanceBranch.upsert({
    where: {
      ownerUserId_trialSessionId_code: {
        ownerUserId,
        trialSessionId,
        code: "MAIN",
      },
    },
    update: { name: "สาขาหลัก" },
    create: {
      ownerUserId,
      trialSessionId,
      name: "สาขาหลัก",
      code: "MAIN",
      sortOrder: 0,
    },
  });

  const locations = [
    { name: "หน้าสำนักงาน", lat: 13.7563, lng: 100.5018, radius: 180, sortOrder: 0 },
    { name: "โซนคลังสินค้า", lat: 13.7549, lng: 100.5032, radius: 220, sortOrder: 1 },
  ] as const;

  const locationRows: Array<{ id: number; name: string }> = [];
  for (const loc of locations) {
    const row = await prisma.attendanceLocation.upsert({
      where: {
        id: (
          await prisma.attendanceLocation.findFirst({
            where: { ownerUserId, trialSessionId, name: loc.name },
            select: { id: true },
          })
        )?.id ?? -1,
      },
      update: {
        allowedLocationLat: loc.lat,
        allowedLocationLng: loc.lng,
        radiusMeters: loc.radius,
        sortOrder: loc.sortOrder,
      },
      create: {
        ownerUserId,
        trialSessionId,
        branchId: branch.id,
        name: loc.name,
        allowedLocationLat: loc.lat,
        allowedLocationLng: loc.lng,
        radiusMeters: loc.radius,
        sortOrder: loc.sortOrder,
      },
      select: { id: true, name: true },
    });
    locationRows.push(row);
  }

  for (const loc of locationRows) {
    await prisma.attendanceShift.deleteMany({ where: { locationId: loc.id } });
    await prisma.attendanceShift.createMany({
      data: [
        { locationId: loc.id, startTime: "08:30", endTime: "17:30", sortOrder: 0 },
        { locationId: loc.id, startTime: "13:00", endTime: "22:00", sortOrder: 1 },
      ],
    });
  }

  for (const row of ROSTER_SEEDS) {
    await prisma.attendanceRosterEntry.upsert({
      where: {
        ownerUserId_phone_trialSessionId: {
          ownerUserId,
          phone: row.phone,
          trialSessionId,
        },
      },
      update: {
        displayName: row.displayName,
        rosterShiftIndex: row.rosterShiftIndex,
        isActive: row.isActive,
        photoUrl: row.photoUrl,
      },
      create: {
        ownerUserId,
        trialSessionId,
        displayName: row.displayName,
        phone: row.phone,
        rosterShiftIndex: row.rosterShiftIndex,
        isActive: row.isActive,
        photoUrl: row.photoUrl,
      },
    });
  }

  const logs = [
    {
      guestPhone: "0812345001",
      guestName: "สมชาย หัวหน้างาน",
      publicVisitorKind: "ROSTER_STAFF" as const,
      checkInTime: bangkokDate(0, 8, 55),
      checkOutTime: null,
      status: "AWAITING_CHECKOUT" as const,
      lateCheckIn: false,
      earlyCheckOut: false,
      note: "ข้อมูลทดลอง",
    },
    {
      guestPhone: "0812345002",
      guestName: "สุดา แคชเชียร์",
      publicVisitorKind: "ROSTER_STAFF" as const,
      checkInTime: bangkokDate(0, 9, 18),
      checkOutTime: bangkokDate(0, 18, 3),
      status: "LATE" as const,
      lateCheckIn: true,
      earlyCheckOut: false,
      note: "ข้อมูลทดลอง",
    },
    {
      guestPhone: "0899999001",
      guestName: "ช่างภายนอก",
      publicVisitorKind: "EXTERNAL_GUEST" as const,
      checkInTime: bangkokDate(-1, 10, 5),
      checkOutTime: bangkokDate(-1, 16, 12),
      status: "ON_TIME" as const,
      lateCheckIn: false,
      earlyCheckOut: false,
      note: "ข้อมูลทดลอง",
    },
    {
      actorUserId: ownerUserId,
      guestPhone: null,
      guestName: null,
      publicVisitorKind: null,
      checkInTime: bangkokDate(-2, 9, 3),
      checkOutTime: bangkokDate(-2, 17, 10),
      status: "ON_TIME" as const,
      lateCheckIn: false,
      earlyCheckOut: false,
      note: "บันทึกผ่านแอปเจ้าของ",
    },
    {
      guestPhone: "0812345003",
      guestName: "กิตติพงษ์ ฝ่ายผลิต",
      publicVisitorKind: "ROSTER_STAFF" as const,
      checkInTime: bangkokDate(-3, 13, 20),
      checkOutTime: bangkokDate(-3, 20, 45),
      status: "LATE_AND_EARLY" as const,
      lateCheckIn: true,
      earlyCheckOut: true,
      note: "ข้อมูลทดลอง",
    },
  ] as const;

  for (const row of logs) {
    const existed = await prisma.attendanceLog.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        guestPhone: row.guestPhone ?? undefined,
        actorUserId: "actorUserId" in row ? row.actorUserId : undefined,
        checkInTime: row.checkInTime,
      },
      select: { id: true },
    });
    if (existed) continue;
    await prisma.attendanceLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        actorUserId: "actorUserId" in row ? row.actorUserId : null,
        guestPhone: row.guestPhone,
        guestName: row.guestName,
        publicVisitorKind: row.publicVisitorKind,
        checkInTime: row.checkInTime,
        checkOutTime: row.checkOutTime,
        checkInLat: 13.7563,
        checkInLng: 100.5018,
        checkOutLat: row.checkOutTime ? 13.7562 : null,
        checkOutLng: row.checkOutTime ? 100.5019 : null,
        status: row.status,
        lateCheckIn: row.lateCheckIn,
        earlyCheckOut: row.earlyCheckOut,
        appliedShiftIndex: 0,
        note: row.note,
      },
    });
  }
}

async function main() {
  const moduleRow = await prisma.appModule.findFirst({
    where: { slug: ATTENDANCE_MODULE_SLUG },
    select: { id: true },
  });
  if (!moduleRow) {
    console.log("Attendance module not found.");
    return;
  }

  let sessions = await prisma.trialSession.findMany({
    where: {
      moduleId: moduleRow.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true, user: { select: { email: true } } },
  });

  if (sessions.length === 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: [...FALLBACK_TRIAL_EMAILS] } },
      select: { id: true, email: true },
    });
    for (const user of users) {
      await startTrial(user.id, moduleRow.id);
      console.log(`Started attendance trial for ${user.email ?? user.id}`);
    }
    sessions = await prisma.trialSession.findMany({
      where: {
        moduleId: moduleRow.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
        userId: { in: users.map((u) => u.id) },
      },
      select: { id: true, userId: true, user: { select: { email: true } } },
    });
  }

  for (const s of sessions) {
    await ensureAttendanceDemoData(s.userId, s.id);
    console.log(`Seeded attendance trial data for ${s.user.email ?? s.userId}`);
  }

  const fallbackUsers = await prisma.user.findMany({
    where: { email: { in: [...FALLBACK_TRIAL_EMAILS] } },
    select: { id: true, email: true },
  });
  for (const user of fallbackUsers) {
    const subscribed = (await listSubscribedModuleIds(user.id)).includes(moduleRow.id);
    if (!subscribed) continue;
    await ensureAttendanceDemoData(user.id, "prod");
    console.log(`Seeded attendance prod data for subscribed user ${user.email ?? user.id}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


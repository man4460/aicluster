import { prisma } from "@/lib/prisma";
import type { EducareCheckFeature, EducareCheckStatus } from "@/generated/prisma/enums";

export type EducareScopeArgs = {
  ownerUserId: string;
  trialSessionId: string;
};

/** YYYY-MM-DD ตามเวลาไทย — ใช้ทำคีย์ + label */
export function bangkokYmd(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function ymdToDateUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((s) => Number(s));
  return new Date(Date.UTC(y, m - 1, d));
}

export function shiftYmd(ymd: string, deltaDays: number): string {
  const d = ymdToDateUTC(ymd);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return bangkokYmd(d);
}

export function lastNDaysYmd(n: number, today = bangkokYmd()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(shiftYmd(today, -i));
  return out;
}

export type EducareCheckRecordRow = {
  id: bigint;
  studentId: number;
  classroomId: number;
  date: Date;
  feature: EducareCheckFeature;
  status: EducareCheckStatus;
  meta: unknown;
  note: string | null;
  recordedAt: Date;
};

export type EducareDashboardData = {
  date: string;
  studentCount: number;
  classroomCount: number;
  todayRecordCount: number;
  assembly: { present: number; late: number; absent: number; excused: number };
  yesterdayAssembly: { present: number; late: number; absent: number; excused: number };
  delta: { present: number; absent: number };
  activities: {
    milk: { done: number; partial: number; notDone: number; total: number };
    meal: { done: number; partial: number; notDone: number; total: number };
    brushing: { done: number; partial: number; notDone: number; total: number };
  };
  tidiness: { pass: number; fail: number; checked: number };
  classrooms: Array<{
    id: number;
    name: string;
    grade: string | null;
    totalStudents: number;
    assembly: { checked: number; present: number; absent: number };
    completed: boolean;
  }>;
  recentActivity: Array<{
    feature: EducareCheckFeature;
    status: EducareCheckStatus;
    studentName: string;
    nickname: string | null;
    photoUrl: string | null;
    classroomName: string;
    recordedAt: Date;
  }>;
  trend7d: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
  }>;
  topPerformers: Array<{
    studentId: number;
    fullName: string;
    nickname: string | null;
    photoUrl: string | null;
    classroomName: string;
    perfectDays: number;
  }>;
  concerns: Array<{
    studentId: number;
    fullName: string;
    nickname: string | null;
    photoUrl: string | null;
    classroomName: string;
    absentDays: number;
  }>;
};

export async function loadEducareDashboard(
  scope: EducareScopeArgs,
): Promise<EducareDashboardData> {
  const today = bangkokYmd();
  const yesterday = shiftYmd(today, -1);
  const sevenDaysAgo = shiftYmd(today, -6);

  const [classrooms, students, records7d] = await Promise.all([
    prisma.educareClassroom.findMany({
      where: { ownerUserId: scope.ownerUserId, trialSessionId: scope.trialSessionId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true, grade: true },
    }),
    prisma.educareStudent.findMany({
      where: { ownerUserId: scope.ownerUserId, trialSessionId: scope.trialSessionId, isActive: true },
      select: {
        id: true,
        classroomId: true,
        fullName: true,
        nickname: true,
        photoUrl: true,
      },
    }),
    prisma.educareCheckRecord.findMany({
      where: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        date: { gte: ymdToDateUTC(sevenDaysAgo), lte: ymdToDateUTC(today) },
      },
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        date: true,
        feature: true,
        status: true,
        meta: true,
        note: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: "desc" },
    }),
  ]);

  const classroomMap = new Map(classrooms.map((c) => [c.id, c]));
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Grouping by date string + classroom counts
  const todayRecs = records7d.filter((r) => bangkokYmd(r.date) === today);
  const yesterdayRecs = records7d.filter((r) => bangkokYmd(r.date) === yesterday);

  const assembly = { present: 0, late: 0, absent: 0, excused: 0 };
  const yAssembly = { present: 0, late: 0, absent: 0, excused: 0 };
  const tidiness = { pass: 0, fail: 0, checked: 0 };
  const activities = {
    milk: { done: 0, partial: 0, notDone: 0, total: 0 },
    meal: { done: 0, partial: 0, notDone: 0, total: 0 },
    brushing: { done: 0, partial: 0, notDone: 0, total: 0 },
  };

  for (const r of todayRecs) {
    if (r.feature === "ASSEMBLY") {
      if (r.status === "PRESENT") assembly.present++;
      else if (r.status === "LATE") assembly.late++;
      else if (r.status === "ABSENT") assembly.absent++;
      else if (r.status === "EXCUSED") assembly.excused++;
    }
    if (r.feature === "TIDINESS" && r.status !== "NA") {
      tidiness.checked++;
      if (r.status === "PASS") tidiness.pass++;
      else if (r.status === "FAIL") tidiness.fail++;
    }
    const bucket =
      r.feature === "MILK"
        ? activities.milk
        : r.feature === "MEAL"
          ? activities.meal
          : r.feature === "BRUSHING"
            ? activities.brushing
            : null;
    if (bucket) {
      if (r.status === "DONE") {
        bucket.done++;
        bucket.total++;
      } else if (r.status === "PARTIAL") {
        bucket.partial++;
        bucket.total++;
      } else if (r.status === "NOT_DONE") {
        bucket.notDone++;
        bucket.total++;
      }
    }
  }
  for (const r of yesterdayRecs) {
    if (r.feature !== "ASSEMBLY") continue;
    if (r.status === "PRESENT") yAssembly.present++;
    else if (r.status === "LATE") yAssembly.late++;
    else if (r.status === "ABSENT") yAssembly.absent++;
    else if (r.status === "EXCUSED") yAssembly.excused++;
  }

  // Classroom progress (assembly only — สำคัญสุด)
  const perRoom = new Map<
    number,
    { id: number; name: string; grade: string | null; totalStudents: number; assembly: { checked: number; present: number; absent: number } }
  >();
  for (const c of classrooms) {
    perRoom.set(c.id, {
      id: c.id,
      name: c.name,
      grade: c.grade,
      totalStudents: 0,
      assembly: { checked: 0, present: 0, absent: 0 },
    });
  }
  for (const s of students) {
    const room = perRoom.get(s.classroomId);
    if (room) room.totalStudents++;
  }
  for (const r of todayRecs) {
    if (r.feature !== "ASSEMBLY") continue;
    const room = perRoom.get(r.classroomId);
    if (!room) continue;
    room.assembly.checked++;
    if (r.status === "PRESENT") room.assembly.present++;
    else if (r.status === "ABSENT") room.assembly.absent++;
  }

  // 7-day trend
  const trendMap = new Map<string, { present: number; late: number; absent: number; excused: number }>();
  for (const ymd of lastNDaysYmd(7, today)) {
    trendMap.set(ymd, { present: 0, late: 0, absent: 0, excused: 0 });
  }
  for (const r of records7d) {
    if (r.feature !== "ASSEMBLY") continue;
    const ymd = bangkokYmd(r.date);
    const entry = trendMap.get(ymd);
    if (!entry) continue;
    if (r.status === "PRESENT") entry.present++;
    else if (r.status === "LATE") entry.late++;
    else if (r.status === "ABSENT") entry.absent++;
    else if (r.status === "EXCUSED") entry.excused++;
  }

  // Top performers / concerns ใน 7 วัน (ใช้ assembly records)
  const perStudentPerfect = new Map<number, number>();
  const perStudentAbsent = new Map<number, number>();
  for (const r of records7d) {
    if (r.feature !== "ASSEMBLY") continue;
    if (r.status === "PRESENT") {
      perStudentPerfect.set(r.studentId, (perStudentPerfect.get(r.studentId) ?? 0) + 1);
    } else if (r.status === "ABSENT") {
      perStudentAbsent.set(r.studentId, (perStudentAbsent.get(r.studentId) ?? 0) + 1);
    }
  }

  const topPerformers = [...perStudentPerfect.entries()]
    .map(([sid, n]) => {
      const s = studentMap.get(sid);
      if (!s) return null;
      const c = classroomMap.get(s.classroomId);
      return {
        studentId: sid,
        fullName: s.fullName,
        nickname: s.nickname,
        photoUrl: s.photoUrl,
        classroomName: c?.name ?? "",
        perfectDays: n,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.perfectDays - a!.perfectDays))
    .slice(0, 5) as EducareDashboardData["topPerformers"];

  const concerns = [...perStudentAbsent.entries()]
    .filter(([, n]) => n >= 2)
    .map(([sid, n]) => {
      const s = studentMap.get(sid);
      if (!s) return null;
      const c = classroomMap.get(s.classroomId);
      return {
        studentId: sid,
        fullName: s.fullName,
        nickname: s.nickname,
        photoUrl: s.photoUrl,
        classroomName: c?.name ?? "",
        absentDays: n,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.absentDays - a!.absentDays))
    .slice(0, 5) as EducareDashboardData["concerns"];

  // Recent activity (12 ล่าสุด today)
  const recentActivity = todayRecs
    .slice(0, 12)
    .map((r) => {
      const s = studentMap.get(r.studentId);
      const c = classroomMap.get(r.classroomId);
      return {
        feature: r.feature,
        status: r.status,
        studentName: s?.fullName ?? "-",
        nickname: s?.nickname ?? null,
        photoUrl: s?.photoUrl ?? null,
        classroomName: c?.name ?? "",
        recordedAt: r.recordedAt,
      };
    });

  const classroomsOut = [...perRoom.values()].map((room) => ({
    id: room.id,
    name: room.name,
    grade: room.grade,
    totalStudents: room.totalStudents,
    assembly: room.assembly,
    completed: room.totalStudents > 0 && room.assembly.checked >= room.totalStudents,
  }));

  return {
    date: today,
    studentCount: students.length,
    classroomCount: classrooms.length,
    todayRecordCount: todayRecs.length,
    assembly,
    yesterdayAssembly: yAssembly,
    delta: {
      present: assembly.present - yAssembly.present,
      absent: assembly.absent - yAssembly.absent,
    },
    activities,
    tidiness,
    classrooms: classroomsOut,
    recentActivity,
    trend7d: [...trendMap.entries()].map(([date, val]) => ({ date, ...val })),
    topPerformers,
    concerns,
  };
}

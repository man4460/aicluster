import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  bangkokYmd,
  ymdToDateUTC,
} from "@/systems/educare/lib/educare-data";
import {
  EDUCARE_DEFAULT_STATUS,
  EDUCARE_FEATURE_STATUS,
} from "@/systems/educare/lib/educare-types";
import type { EducareCheckStatus, EducareCheckFeature } from "@/generated/prisma/enums";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const querySchema = z.object({
  classroomId: z.coerce.number().int().positive(),
  feature: z.enum(["ASSEMBLY", "TIDINESS", "CLASS_ATTENDANCE", "MEAL", "BRUSHING", "MILK"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function inferDefaultStatus(
  feature: EducareCheckFeature,
  assemblyStatus: EducareCheckStatus | undefined,
): EducareCheckStatus {
  // ถ้าขาด/ลา → ฟีเจอร์อื่นเป็น na
  if (assemblyStatus === "ABSENT" || assemblyStatus === "EXCUSED") {
    if (feature === "CLASS_ATTENDANCE") return assemblyStatus;
    if (feature === "TIDINESS") return "NA";
    if (feature === "MEAL" || feature === "BRUSHING" || feature === "MILK") return "NA";
  }
  return EDUCARE_DEFAULT_STATUS[feature];
}

export async function GET(req: Request) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    classroomId: url.searchParams.get("classroomId") ?? undefined,
    feature: url.searchParams.get("feature") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { classroomId, feature } = parsed.data;
  const ymd = parsed.data.date ?? bangkokYmd();

  const classroom = await prisma.educareClassroom.findFirst({
    where: {
      id: classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
  });
  if (!classroom) return NextResponse.json({ error: "ไม่พบห้องเรียน" }, { status: 404 });

  const dateUtc = ymdToDateUTC(ymd);
  const [students, todayRecs] = await Promise.all([
    prisma.educareStudent.findMany({
      where: {
        ownerUserId: r.ctx.ownerUserId,
        trialSessionId: r.ctx.trialSessionId,
        classroomId,
        isActive: true,
      },
      orderBy: { studentNo: "asc" },
    }),
    prisma.educareCheckRecord.findMany({
      where: {
        ownerUserId: r.ctx.ownerUserId,
        trialSessionId: r.ctx.trialSessionId,
        classroomId,
        date: dateUtc,
      },
    }),
  ]);

  const recByStudentFeature = new Map<string, (typeof todayRecs)[number]>();
  const assemblyMap = new Map<number, EducareCheckStatus>();
  for (const rec of todayRecs) {
    if (rec.feature === "ASSEMBLY") {
      assemblyMap.set(rec.studentId, rec.status);
    }
    const k = `${rec.studentId}|${rec.feature}`;
    recByStudentFeature.set(k, rec);
  }

  const validStatuses = EDUCARE_FEATURE_STATUS[feature];
  const roster = students.map((s) => {
    const rec = recByStudentFeature.get(`${s.id}|${feature}`);
    const assemblyStatus = assemblyMap.get(s.id);
    const status: EducareCheckStatus =
      rec?.status ?? inferDefaultStatus(feature as EducareCheckFeature, assemblyStatus);
    return {
      studentId: s.id,
      studentNo: s.studentNo,
      fullName: s.fullName,
      nickname: s.nickname,
      photoUrl: s.photoUrl,
      gender: s.gender,
      assemblyStatus: assemblyStatus ?? null,
      recordId: rec ? String(rec.id) : null,
      status,
      note: rec?.note ?? "",
      meta: rec?.meta ?? null,
      isDefault: !rec,
    };
  });

  const stats = {
    total: students.length,
    checked: roster.filter((r2) => !r2.isDefault).length,
  };

  return NextResponse.json({
    classroomId,
    feature,
    date: ymd,
    validStatuses,
    roster,
    stats,
  });
}

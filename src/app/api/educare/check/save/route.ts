import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bangkokYmd, ymdToDateUTC } from "@/systems/educare/lib/educare-data";
import { isValidStatusForFeature } from "@/systems/educare/lib/educare-types";
import type { EducareFeatureKey } from "@/systems/educare/lib/educare-types";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const saveSchema = z.object({
  classroomId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  feature: z.enum(["ASSEMBLY", "TIDINESS", "CLASS_ATTENDANCE", "MEAL", "BRUSHING", "MILK"]),
  status: z.enum([
    "PRESENT",
    "LATE",
    "ABSENT",
    "EXCUSED",
    "PASS",
    "FAIL",
    "DONE",
    "PARTIAL",
    "NOT_DONE",
    "NA",
  ]),
  note: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: Request) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = saveSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const data = parsed.data;
  const ymd = data.date ?? bangkokYmd();

  if (!isValidStatusForFeature(data.feature as EducareFeatureKey, data.status)) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้องสำหรับฟีเจอร์นี้" }, { status: 400 });
  }

  const classroom = await prisma.educareClassroom.findFirst({
    where: {
      id: data.classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
  });
  if (!classroom) return NextResponse.json({ error: "ไม่พบห้องเรียน" }, { status: 404 });

  const student = await prisma.educareStudent.findFirst({
    where: {
      id: data.studentId,
      classroomId: data.classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
  });
  if (!student) return NextResponse.json({ error: "ไม่พบนักเรียนในห้องนี้" }, { status: 404 });

  const date = ymdToDateUTC(ymd);

  const existing = await prisma.educareCheckRecord.findUnique({
    where: {
      studentId_date_feature: {
        studentId: data.studentId,
        date,
        feature: data.feature,
      },
    },
  });

  const metaInput = data.meta === undefined ? Prisma.DbNull : (data.meta as Prisma.InputJsonValue);

  let saved;
  if (existing) {
    saved = await prisma.educareCheckRecord.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        note: data.note ?? null,
        meta: metaInput,
      },
    });
  } else {
    saved = await prisma.educareCheckRecord.create({
      data: {
        ownerUserId: r.ctx.ownerUserId,
        trialSessionId: r.ctx.trialSessionId,
        classroomId: data.classroomId,
        studentId: data.studentId,
        date,
        feature: data.feature,
        status: data.status,
        note: data.note ?? null,
        meta: metaInput,
      },
    });
  }

  return NextResponse.json({
    record: {
      id: String(saved.id),
      studentId: saved.studentId,
      classroomId: saved.classroomId,
      feature: saved.feature,
      status: saved.status,
      meta: saved.meta,
      note: saved.note,
    },
  });
}

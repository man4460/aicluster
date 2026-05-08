import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bangkokYmd, ymdToDateUTC } from "@/systems/educare/lib/educare-data";
import { isValidStatusForFeature } from "@/systems/educare/lib/educare-types";
import type { EducareFeatureKey } from "@/systems/educare/lib/educare-types";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const itemSchema = z.object({
  studentId: z.number().int().positive(),
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
  meta: z.record(z.string(), z.any()).optional(),
});

const bulkSchema = z.object({
  classroomId: z.number().int().positive(),
  feature: z.enum(["ASSEMBLY", "TIDINESS", "CLASS_ATTENDANCE", "MEAL", "BRUSHING", "MILK"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  items: z.array(itemSchema).min(1).max(500),
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
  const parsed = bulkSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { classroomId, feature, items } = parsed.data;
  const ymd = parsed.data.date ?? bangkokYmd();

  for (const it of items) {
    if (!isValidStatusForFeature(feature as EducareFeatureKey, it.status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้องสำหรับฟีเจอร์นี้" }, { status: 400 });
    }
  }

  const classroom = await prisma.educareClassroom.findFirst({
    where: {
      id: classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
  });
  if (!classroom) return NextResponse.json({ error: "ไม่พบห้องเรียน" }, { status: 404 });

  // กรองให้แน่ใจว่าทุก studentId อยู่ในห้องนี้และเป็นของเจ้าของ
  const studentIds = [...new Set(items.map((i) => i.studentId))];
  const students = await prisma.educareStudent.findMany({
    where: {
      id: { in: studentIds },
      classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
    select: { id: true },
  });
  const valid = new Set(students.map((s) => s.id));
  const filtered = items.filter((i) => valid.has(i.studentId));

  const date = ymdToDateUTC(ymd);

  // Find existing records in one pass
  const existing = await prisma.educareCheckRecord.findMany({
    where: {
      classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      date,
      feature,
      studentId: { in: filtered.map((i) => i.studentId) },
    },
  });
  const existMap = new Map(existing.map((e) => [e.studentId, e]));

  let created = 0;
  let updated = 0;
  await prisma.$transaction(async (tx) => {
    for (const it of filtered) {
      const metaInput =
        it.meta === undefined ? Prisma.DbNull : (it.meta as Prisma.InputJsonValue);
      const ex = existMap.get(it.studentId);
      if (ex) {
        await tx.educareCheckRecord.update({
          where: { id: ex.id },
          data: {
            status: it.status,
            note: it.note ?? null,
            meta: metaInput,
          },
        });
        updated++;
      } else {
        await tx.educareCheckRecord.create({
          data: {
            ownerUserId: r.ctx.ownerUserId,
            trialSessionId: r.ctx.trialSessionId,
            classroomId,
            studentId: it.studentId,
            date,
            feature,
            status: it.status,
            note: it.note ?? null,
            meta: metaInput,
          },
        });
        created++;
      }
    }
  });

  return NextResponse.json({
    ok: true,
    count: filtered.length,
    created,
    updated,
    skipped: items.length - filtered.length,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const upsertSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(60),
  grade: z.string().trim().max(40).optional().nullable(),
  level: z.string().trim().max(40).optional().nullable(),
  homeroomTeacherName: z.string().trim().max(120).optional().nullable(),
  homeroomTeacherPhone: z.string().trim().max(40).optional().nullable(),
  isActive: z.boolean().optional(),
});

async function ensureSchool(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.educareSchool.findFirst({
    where: { ownerUserId, trialSessionId, isActive: true },
    orderBy: { id: "asc" },
  });
  if (existing) return existing;
  return prisma.educareSchool.create({
    data: { ownerUserId, trialSessionId, name: "โรงเรียนของฉัน" },
  });
}

export async function GET() {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  const classrooms = await prisma.educareClassroom.findMany({
    where: {
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      _count: { select: { students: { where: { isActive: true } } } },
    },
  });
  return NextResponse.json({
    classrooms: classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      level: c.level,
      homeroomTeacherName: c.homeroomTeacherName,
      homeroomTeacherPhone: c.homeroomTeacherPhone,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      studentCount: c._count.students,
    })),
  });
}

export async function POST(req: Request) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const data = parsed.data;
  const school = await ensureSchool(r.ctx.ownerUserId, r.ctx.trialSessionId);

  if (data.id) {
    const existing = await prisma.educareClassroom.findFirst({
      where: {
        id: data.id,
        ownerUserId: r.ctx.ownerUserId,
        trialSessionId: r.ctx.trialSessionId,
      },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบห้องเรียน" }, { status: 404 });
    const updated = await prisma.educareClassroom.update({
      where: { id: data.id },
      data: {
        name: data.name,
        grade: data.grade?.trim() || null,
        level: data.level?.trim() || null,
        homeroomTeacherName: data.homeroomTeacherName?.trim() || null,
        homeroomTeacherPhone: data.homeroomTeacherPhone?.trim() || null,
        isActive: data.isActive ?? existing.isActive,
      },
    });
    return NextResponse.json({ classroom: updated });
  }

  const last = await prisma.educareClassroom.findFirst({
    where: { ownerUserId: r.ctx.ownerUserId, trialSessionId: r.ctx.trialSessionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const created = await prisma.educareClassroom.create({
    data: {
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      schoolId: school.id,
      name: data.name,
      grade: data.grade?.trim() || null,
      level: data.level?.trim() || null,
      homeroomTeacherName: data.homeroomTeacherName?.trim() || null,
      homeroomTeacherPhone: data.homeroomTeacherPhone?.trim() || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ classroom: created });
}

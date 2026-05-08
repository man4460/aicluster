import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const upsertSchema = z.object({
  id: z.number().int().positive().optional(),
  classroomId: z.number().int().positive(),
  studentNo: z.string().trim().min(1).max(20),
  fullName: z.string().trim().min(1).max(120),
  nickname: z.string().trim().max(60).optional().nullable(),
  gender: z.enum(["M", "F"]).optional().nullable(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  photoUrl: z.string().trim().max(512).optional().nullable(),
  parentName: z.string().trim().max(120).optional().nullable(),
  parentPhone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

const querySchema = z.object({
  classroomId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(80).optional(),
});

function ymdToDateOrNull(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(req: Request) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    classroomId: url.searchParams.get("classroomId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { classroomId, q } = parsed.data;

  const students = await prisma.educareStudent.findMany({
    where: {
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      isActive: true,
      ...(classroomId ? { classroomId } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { nickname: { contains: q } },
              { studentNo: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ classroomId: "asc" }, { studentNo: "asc" }],
    include: {
      classroom: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      classroomId: s.classroomId,
      classroomName: s.classroom?.name ?? "",
      studentNo: s.studentNo,
      fullName: s.fullName,
      nickname: s.nickname,
      gender: s.gender,
      birthdate: s.birthdate ? s.birthdate.toISOString().slice(0, 10) : null,
      photoUrl: s.photoUrl,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      address: s.address,
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

  // verify classroom belongs to owner
  const classroom = await prisma.educareClassroom.findFirst({
    where: {
      id: data.classroomId,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
  });
  if (!classroom) return NextResponse.json({ error: "ห้องเรียนไม่ถูกต้อง" }, { status: 400 });

  if (data.id) {
    const existing = await prisma.educareStudent.findFirst({
      where: {
        id: data.id,
        ownerUserId: r.ctx.ownerUserId,
        trialSessionId: r.ctx.trialSessionId,
      },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบนักเรียน" }, { status: 404 });
    const updated = await prisma.educareStudent.update({
      where: { id: data.id },
      data: {
        classroomId: data.classroomId,
        studentNo: data.studentNo,
        fullName: data.fullName,
        nickname: data.nickname?.trim() || null,
        gender: data.gender ?? null,
        birthdate: ymdToDateOrNull(data.birthdate),
        photoUrl: data.photoUrl?.trim() || null,
        parentName: data.parentName?.trim() || null,
        parentPhone: data.parentPhone?.trim() || null,
        address: data.address?.trim() || null,
        isActive: data.isActive ?? existing.isActive,
      },
    });
    return NextResponse.json({ student: updated });
  }

  // create — กัน duplicate student_no ในห้องเดียวกัน
  const dup = await prisma.educareStudent.findFirst({
    where: {
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      classroomId: data.classroomId,
      studentNo: data.studentNo,
    },
  });
  if (dup) return NextResponse.json({ error: "เลขที่ซ้ำในห้องนี้" }, { status: 409 });

  const created = await prisma.educareStudent.create({
    data: {
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      classroomId: data.classroomId,
      studentNo: data.studentNo,
      fullName: data.fullName,
      nickname: data.nickname?.trim() || null,
      gender: data.gender ?? null,
      birthdate: ymdToDateOrNull(data.birthdate),
      photoUrl: data.photoUrl?.trim() || null,
      parentName: data.parentName?.trim() || null,
      parentPhone: data.parentPhone?.trim() || null,
      address: data.address?.trim() || null,
    },
  });
  return NextResponse.json({ student: created });
}

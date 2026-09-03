import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsCourse, mapLmsExam, mapLmsLesson } from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const row = await prisma.lmsCourse.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        exam: { include: { questions: { orderBy: { orderIndex: "asc" } } } },
        lessons: { orderBy: { orderIndex: "asc" } },
      },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });
    return NextResponse.json({
      course: mapLmsCourse(row),
      lessons: row.lessons.map(mapLmsLesson),
      exam: row.exam ? mapLmsExam(row.exam) : null,
    });
  } catch (e) {
    console.error("[lms/session/courses/[id] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsCourse.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const row = await prisma.lmsCourse.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : existing.title,
        description: typeof body.description === "string" ? body.description : existing.description,
        coverImageUrl:
          typeof body.coverImageUrl === "string"
            ? body.coverImageUrl.slice(0, 512)
            : body.coverImageUrl === null
              ? null
              : existing.coverImageUrl,
        status: body.status === "PUBLISHED" || body.status === "DRAFT" ? body.status : existing.status,
        priceBaht:
          typeof body.priceBaht === "number" ? Math.max(0, Math.round(body.priceBaht)) : existing.priceBaht,
      },
      include: { _count: { select: { lessons: true, enrollments: true } }, exam: { select: { id: true } } },
    });
    return NextResponse.json({ course: mapLmsCourse(row) });
  } catch (e) {
    console.error("[lms/session/courses/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsCourse.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });
    await prisma.lmsCourse.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lms/session/courses/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}

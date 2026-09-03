import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsEnrollment } from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsEnrollment.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบการลงทะเบียน" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    let status = existing.status;
    if (body.status === "ENROLLED" || body.status === "IN_PROGRESS" || body.status === "COMPLETED") {
      status = body.status;
    }

    const completedAt =
      status === "COMPLETED" ? (existing.completedAt ?? new Date()) : status === existing.status ? existing.completedAt : null;

    const row = await prisma.lmsEnrollment.update({
      where: { id },
      data: {
        status,
        progressPercent:
          typeof body.progressPercent === "number" && Number.isFinite(body.progressPercent)
            ? Math.min(100, Math.max(0, Math.round(body.progressPercent)))
            : existing.progressPercent,
        examScorePercent:
          typeof body.examScorePercent === "number" && Number.isFinite(body.examScorePercent)
            ? Math.min(100, Math.max(0, Math.round(body.examScorePercent)))
            : body.examScorePercent === null
              ? null
              : existing.examScorePercent,
        completedAt,
      },
      include: { learner: true, course: true },
    });

    return NextResponse.json({ enrollment: mapLmsEnrollment(row) });
  } catch (e) {
    console.error("[lms/session/enrollments/[id] PATCH]", e);
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
    const existing = await prisma.lmsEnrollment.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบการลงทะเบียน" }, { status: 404 });

    await prisma.lmsEnrollment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lms/session/enrollments/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeEducation } from "@/systems/pro-resume/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const existing = await prisma.resumeEducation.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const updated = await prisma.resumeEducation.update({
      where: { id },
      data: {
        degree: typeof body.degree === "string" ? body.degree.trim().slice(0, 200) : existing.degree,
        institution:
          typeof body.institution === "string"
            ? body.institution.trim().slice(0, 200)
            : existing.institution,
        startYear: typeof body.startYear === "number" ? body.startYear : body.startYear === null ? null : existing.startYear,
        endYear: typeof body.endYear === "number" ? body.endYear : body.endYear === null ? null : existing.endYear,
        description: typeof body.description === "string" ? body.description : existing.description,
      },
    });
    return NextResponse.json({ education: mapResumeEducation(updated) });
  } catch (e) {
    console.error("[pro-resume/session/educations/[id] PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const existing = await prisma.resumeEducation.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    await prisma.resumeEducation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pro-resume/session/educations/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}

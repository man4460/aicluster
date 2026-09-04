import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeExperience } from "@/systems/pro-resume/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const existing = await prisma.resumeExperience.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const updated = await prisma.resumeExperience.update({
      where: { id },
      data: {
        jobTitle: typeof body.jobTitle === "string" ? body.jobTitle.trim().slice(0, 200) : existing.jobTitle,
        company: typeof body.company === "string" ? body.company.trim().slice(0, 200) : existing.company,
        startDate: typeof body.startDate === "string" ? body.startDate.slice(0, 32) : existing.startDate,
        endDate:
          typeof body.endDate === "string"
            ? body.endDate.slice(0, 32)
            : body.endDate === null
              ? null
              : existing.endDate,
        achievements: typeof body.achievements === "string" ? body.achievements : existing.achievements,
      },
    });
    return NextResponse.json({ experience: mapResumeExperience(updated) });
  } catch (e) {
    console.error("[pro-resume/session/experiences/[id] PUT]", e);
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
    const existing = await prisma.resumeExperience.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    await prisma.resumeExperience.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pro-resume/session/experiences/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}

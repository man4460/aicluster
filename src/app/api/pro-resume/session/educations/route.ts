import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeEducation } from "@/systems/pro-resume/lib/mappers";
import { applyOrderedIds } from "@/systems/pro-resume/lib/helpers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const rows = await prisma.resumeEducation.findMany({
      where: { profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ educations: rows.map(mapResumeEducation) });
  } catch (e) {
    console.error("[pro-resume/session/educations GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;

    if (Array.isArray(body.orderedIds)) {
      const result = await applyOrderedIds(
        prisma.resumeEducation,
        profile.id,
        own.ownerId,
        scope.trialSessionId,
        body.orderedIds.filter((id): id is string => typeof id === "string"),
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      const rows = await prisma.resumeEducation.findMany({
        where: { profileId: profile.id },
        orderBy: { orderIndex: "asc" },
      });
      return NextResponse.json({ educations: rows.map(mapResumeEducation) });
    }

    const degree = typeof body.degree === "string" ? body.degree.trim().slice(0, 200) : "";
    const institution = typeof body.institution === "string" ? body.institution.trim().slice(0, 200) : "";
    if (!degree || !institution) {
      return NextResponse.json({ error: "กรอกวุฒิและสถาบัน" }, { status: 400 });
    }

    const maxOrder = await prisma.resumeEducation.aggregate({
      where: { profileId: profile.id },
      _max: { orderIndex: true },
    });

    const row = await prisma.resumeEducation.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        degree,
        institution,
        startYear: typeof body.startYear === "number" ? body.startYear : null,
        endYear: typeof body.endYear === "number" ? body.endYear : null,
        description: typeof body.description === "string" ? body.description : "",
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
    return NextResponse.json({ education: mapResumeEducation(row) });
  } catch (e) {
    console.error("[pro-resume/session/educations POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeExperience } from "@/systems/pro-resume/lib/mappers";
import { applyOrderedIds } from "@/systems/pro-resume/lib/helpers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const rows = await prisma.resumeExperience.findMany({
      where: { profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ experiences: rows.map(mapResumeExperience) });
  } catch (e) {
    console.error("[pro-resume/session/experiences GET]", e);
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
        prisma.resumeExperience,
        profile.id,
        own.ownerId,
        scope.trialSessionId,
        body.orderedIds.filter((id): id is string => typeof id === "string"),
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      const rows = await prisma.resumeExperience.findMany({
        where: { profileId: profile.id },
        orderBy: { orderIndex: "asc" },
      });
      return NextResponse.json({ experiences: rows.map(mapResumeExperience) });
    }

    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim().slice(0, 200) : "";
    const company = typeof body.company === "string" ? body.company.trim().slice(0, 200) : "";
    if (!jobTitle || !company) {
      return NextResponse.json({ error: "กรอกตำแหน่งและบริษัท" }, { status: 400 });
    }

    const maxOrder = await prisma.resumeExperience.aggregate({
      where: { profileId: profile.id },
      _max: { orderIndex: true },
    });

    const row = await prisma.resumeExperience.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        jobTitle,
        company,
        startDate: typeof body.startDate === "string" ? body.startDate.slice(0, 32) : "",
        endDate: typeof body.endDate === "string" ? body.endDate.slice(0, 32) : null,
        achievements: typeof body.achievements === "string" ? body.achievements : "",
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
    return NextResponse.json({ experience: mapResumeExperience(row) });
  } catch (e) {
    console.error("[pro-resume/session/experiences POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

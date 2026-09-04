import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumePortfolioCategory } from "@/systems/pro-resume/lib/mappers";
import { applyOrderedIds } from "@/systems/pro-resume/lib/helpers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const rows = await prisma.resumePortfolioCategory.findMany({
      where: { profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ categories: rows.map(mapResumePortfolioCategory) });
  } catch (e) {
    console.error("[pro-resume/session/categories GET]", e);
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
        prisma.resumePortfolioCategory,
        profile.id,
        own.ownerId,
        scope.trialSessionId,
        body.orderedIds.filter((id): id is string => typeof id === "string"),
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      const rows = await prisma.resumePortfolioCategory.findMany({
        where: { profileId: profile.id },
        orderBy: { orderIndex: "asc" },
      });
      return NextResponse.json({ categories: rows.map(mapResumePortfolioCategory) });
    }

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่อหมวด" }, { status: 400 });

    const maxOrder = await prisma.resumePortfolioCategory.aggregate({
      where: { profileId: profile.id },
      _max: { orderIndex: true },
    });

    const row = await prisma.resumePortfolioCategory.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        name,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
    return NextResponse.json({ category: mapResumePortfolioCategory(row) });
  } catch (e) {
    console.error("[pro-resume/session/categories POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

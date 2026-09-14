import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeSkill, serializeImagesJson } from "@/systems/pro-resume/lib/mappers";
import { applyOrderedIds } from "@/systems/pro-resume/lib/helpers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const rows = await prisma.resumeSkill.findMany({
      where: { profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ skills: rows.map(mapResumeSkill) });
  } catch (e) {
    console.error("[pro-resume/session/skills GET]", e);
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
        prisma.resumeSkill,
        profile.id,
        own.ownerId,
        scope.trialSessionId,
        body.orderedIds.filter((id): id is string => typeof id === "string"),
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      const rows = await prisma.resumeSkill.findMany({
        where: { profileId: profile.id },
        orderBy: { orderIndex: "asc" },
      });
      return NextResponse.json({ skills: rows.map(mapResumeSkill) });
    }

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่อทักษะพิเศษ" }, { status: 400 });

    const maxOrder = await prisma.resumeSkill.aggregate({
      where: { profileId: profile.id },
      _max: { orderIndex: true },
    });

    const images =
      Array.isArray(body.images)
        ? body.images.filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 24)
        : [];
    const coverImage =
      typeof body.coverImage === "string" && body.coverImage.trim()
        ? body.coverImage.trim().slice(0, 512)
        : images[0] ?? null;

    const row = await prisma.resumeSkill.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        name,
        level: typeof body.level === "string" ? body.level.trim().slice(0, 80) : "",
        shortDesc: typeof body.shortDesc === "string" ? body.shortDesc.trim().slice(0, 500) : "",
        description: typeof body.description === "string" ? body.description : "",
        coverImage,
        imagesJson: serializeImagesJson(images.length ? images : coverImage ? [coverImage] : []),
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
    return NextResponse.json({ skill: mapResumeSkill(row) });
  } catch (e) {
    console.error("[pro-resume/session/skills POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

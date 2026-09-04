import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumePortfolioItem, serializeImagesJson } from "@/systems/pro-resume/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const existing = await prisma.resumePortfolioItem.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบผลงาน" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    let categoryId = existing.categoryId;
    if (typeof body.categoryId === "string" && body.categoryId !== existing.categoryId) {
      const cat = await prisma.resumePortfolioCategory.findFirst({
        where: { id: body.categoryId, profileId: profile.id },
      });
      if (!cat) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 400 });
      categoryId = body.categoryId;
    }

    const images =
      body.images !== undefined && Array.isArray(body.images)
        ? body.images.filter((u): u is string => typeof u === "string").slice(0, 24)
        : undefined;

    const updated = await prisma.resumePortfolioItem.update({
      where: { id },
      data: {
        categoryId,
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : existing.title,
        coverImage:
          typeof body.coverImage === "string"
            ? body.coverImage.slice(0, 512)
            : body.coverImage === null
              ? null
              : existing.coverImage,
        shortDesc: typeof body.shortDesc === "string" ? body.shortDesc.slice(0, 500) : existing.shortDesc,
        contentHTML: typeof body.contentHTML === "string" ? body.contentHTML : existing.contentHTML,
        youtubeUrl:
          typeof body.youtubeUrl === "string"
            ? body.youtubeUrl.slice(0, 512)
            : body.youtubeUrl === null
              ? null
              : existing.youtubeUrl,
        ...(images !== undefined ? { imagesJson: serializeImagesJson(images) } : {}),
      },
    });
    return NextResponse.json({ item: mapResumePortfolioItem(updated) });
  } catch (e) {
    console.error("[pro-resume/session/portfolio/[id] PUT]", e);
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
    const existing = await prisma.resumePortfolioItem.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบผลงาน" }, { status: 404 });

    await prisma.resumePortfolioItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pro-resume/session/portfolio/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}

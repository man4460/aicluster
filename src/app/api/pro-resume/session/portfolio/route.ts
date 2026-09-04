import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumePortfolioItem, serializeImagesJson } from "@/systems/pro-resume/lib/mappers";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId");

    const rows = await prisma.resumePortfolioItem.findMany({
      where: {
        profileId: profile.id,
        ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId),
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ items: rows.map(mapResumePortfolioItem) });
  } catch (e) {
    console.error("[pro-resume/session/portfolio GET]", e);
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

    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    if (!categoryId || !title) {
      return NextResponse.json({ error: "กรอกหมวดและชื่อผลงาน" }, { status: 400 });
    }

    const cat = await prisma.resumePortfolioCategory.findFirst({
      where: { id: categoryId, profileId: profile.id },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 400 });

    const images = Array.isArray(body.images)
      ? body.images.filter((u): u is string => typeof u === "string").slice(0, 24)
      : [];

    const maxOrder = await prisma.resumePortfolioItem.aggregate({
      where: { categoryId },
      _max: { orderIndex: true },
    });

    const row = await prisma.resumePortfolioItem.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        categoryId,
        title,
        coverImage: typeof body.coverImage === "string" ? body.coverImage.slice(0, 512) : null,
        shortDesc: typeof body.shortDesc === "string" ? body.shortDesc.slice(0, 500) : "",
        contentHTML: typeof body.contentHTML === "string" ? body.contentHTML : "",
        youtubeUrl: typeof body.youtubeUrl === "string" ? body.youtubeUrl.slice(0, 512) : null,
        imagesJson: serializeImagesJson(images),
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
    return NextResponse.json({ item: mapResumePortfolioItem(row) });
  } catch (e) {
    console.error("[pro-resume/session/portfolio POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

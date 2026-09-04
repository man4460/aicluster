import { NextResponse } from "next/server";
import { findProResumePublicProfile } from "@/lib/pro-resume/load-public-portal";
import { prisma } from "@/lib/prisma";
import { detectDeviceType } from "@/systems/pro-resume/lib/helpers";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const profile = await findProResumePublicProfile(slug, trialParam);
    if (!profile) return NextResponse.json({ error: "ไม่พบโปรไฟล์" }, { status: 404 });

    const viewerIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const deviceType = detectDeviceType(req.headers.get("user-agent"));

    await prisma.resumeViewAnalytics.create({
      data: {
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        profileId: profile.id,
        viewerIp: viewerIp?.slice(0, 64) ?? null,
        deviceType,
        portfolioItemId: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pro-resume/public/[slug]/view POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

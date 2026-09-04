import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeSessionContextWithPremium } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeProfile } from "@/systems/pro-resume/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContextWithPremium(own.ownerId, own.access);
    return NextResponse.json({
      profile: mapResumeProfile(profile, scope.trialSessionId),
    });
  } catch (e) {
    console.error("[pro-resume/session/profile GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContextWithPremium(own.ownerId, own.access);
    const body = (await req.json()) as Record<string, unknown>;

    const slugRaw = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : profile.slug;
    const slug = slugRaw.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    if (slug.length < 3) {
      return NextResponse.json({ error: "slug ต้องมีอย่างน้อย 3 ตัวอักษร (a-z 0-9 -)" }, { status: 400 });
    }

    const slugTaken = await prisma.resumeProfile.findFirst({
      where: {
        slug,
        trialSessionId: scope.trialSessionId,
        NOT: { id: profile.id },
      },
      select: { id: true },
    });
    if (slugTaken) {
      return NextResponse.json({ error: "slug นี้ถูกใช้แล้ว" }, { status: 409 });
    }

    const updated = await prisma.resumeProfile.update({
      where: { id: profile.id },
      data: {
        slug,
        fullName:
          typeof body.fullName === "string" ? body.fullName.trim().slice(0, 200) : profile.fullName,
        positionTitle:
          typeof body.positionTitle === "string"
            ? body.positionTitle.trim().slice(0, 200)
            : profile.positionTitle,
        bio: typeof body.bio === "string" ? body.bio : profile.bio,
        profileImageUrl:
          typeof body.profileImageUrl === "string"
            ? body.profileImageUrl.slice(0, 512)
            : body.profileImageUrl === null
              ? null
              : profile.profileImageUrl,
        contactEmail:
          typeof body.contactEmail === "string"
            ? body.contactEmail.trim().slice(0, 200)
            : body.contactEmail === null
              ? null
              : profile.contactEmail,
        contactPhone:
          typeof body.contactPhone === "string"
            ? body.contactPhone.trim().slice(0, 32)
            : body.contactPhone === null
              ? null
              : profile.contactPhone,
        publicEnabled:
          typeof body.publicEnabled === "boolean" ? body.publicEnabled : profile.publicEnabled,
        isPremium: profile.isPremium,
      },
    });

    return NextResponse.json({
      profile: mapResumeProfile(updated, scope.trialSessionId),
    });
  } catch (e) {
    console.error("[pro-resume/session/profile PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { mapClubEventProfile } from "@/systems/club-event/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile } = await clubEventSessionContext(own.ownerId);
    return NextResponse.json({ profile: mapClubEventProfile(profile) });
  } catch (e) {
    console.error("[club-event/session/profile GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;

    const slugRaw = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : profile.slug;
    const slug = slugRaw.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    if (slug.length < 3) {
      return NextResponse.json({ error: "slug ต้องมีอย่างน้อย 3 ตัวอักษร (a-z 0-9 -)" }, { status: 400 });
    }

    const slugTaken = await prisma.clubEventProfile.findFirst({
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

    const committeeJson =
      body.committee !== undefined ? JSON.stringify(body.committee) : profile.committeeJson;

    const updated = await prisma.clubEventProfile.update({
      where: { id: profile.id },
      data: {
        slug,
        displayName: typeof body.displayName === "string" ? body.displayName.trim().slice(0, 200) : profile.displayName,
        logoUrl: typeof body.logoUrl === "string" ? body.logoUrl.slice(0, 512) : body.logoUrl === null ? null : profile.logoUrl,
        tagline: typeof body.tagline === "string" ? body.tagline.slice(0, 300) : body.tagline === null ? null : profile.tagline,
        rulesMarkdown: typeof body.rulesMarkdown === "string" ? body.rulesMarkdown : profile.rulesMarkdown,
        committeeJson,
        contactPhone: typeof body.contactPhone === "string" ? body.contactPhone.slice(0, 32) : body.contactPhone === null ? null : profile.contactPhone,
        contactLine: typeof body.contactLine === "string" ? body.contactLine.slice(0, 120) : body.contactLine === null ? null : profile.contactLine,
        promptPayPhone: typeof body.promptPayPhone === "string" ? body.promptPayPhone.slice(0, 20) : body.promptPayPhone === null ? null : profile.promptPayPhone,
        promptPayQrImageUrl:
          typeof body.promptPayQrImageUrl === "string"
            ? body.promptPayQrImageUrl.slice(0, 512)
            : body.promptPayQrImageUrl === null
              ? null
              : profile.promptPayQrImageUrl,
        bankName: typeof body.bankName === "string" ? body.bankName.slice(0, 120) : body.bankName === null ? null : profile.bankName,
        bankAccountNumber:
          typeof body.bankAccountNumber === "string"
            ? body.bankAccountNumber.slice(0, 32)
            : body.bankAccountNumber === null
              ? null
              : profile.bankAccountNumber,
        bankAccountName:
          typeof body.bankAccountName === "string"
            ? body.bankAccountName.slice(0, 200)
            : body.bankAccountName === null
              ? null
              : profile.bankAccountName,
        slipPaperSize: typeof body.slipPaperSize === "string" ? body.slipPaperSize.slice(0, 16) : profile.slipPaperSize,
      },
    });

    return NextResponse.json({ profile: mapClubEventProfile(updated) });
  } catch (e) {
    console.error("[club-event/session/profile PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

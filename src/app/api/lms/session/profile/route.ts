import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsProfile, sanitizeLmsFinanceCategories } from "@/systems/lms/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { profile } = await lmsSessionContext(own.ownerId);
    return NextResponse.json({ profile: mapLmsProfile(profile) });
  } catch (e) {
    console.error("[lms/session/profile GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;

    const slugRaw = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : profile.slug;
    const slug = slugRaw.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    if (slug.length < 3) {
      return NextResponse.json({ error: "slug ต้องมีอย่างน้อย 3 ตัวอักษร (a-z 0-9 -)" }, { status: 400 });
    }

    const slugTaken = await prisma.lmsProfile.findFirst({
      where: { slug, trialSessionId: scope.trialSessionId, NOT: { id: profile.id } },
      select: { id: true },
    });
    if (slugTaken) {
      return NextResponse.json({ error: "slug นี้ถูกใช้แล้ว" }, { status: 409 });
    }

    const updated = await prisma.lmsProfile.update({
      where: { id: profile.id },
      data: {
        slug,
        displayName:
          typeof body.displayName === "string" ? body.displayName.trim().slice(0, 200) : profile.displayName,
        logoUrl:
          typeof body.logoUrl === "string"
            ? body.logoUrl.slice(0, 512)
            : body.logoUrl === null
              ? null
              : profile.logoUrl,
        tagline:
          typeof body.tagline === "string"
            ? body.tagline.slice(0, 300)
            : body.tagline === null
              ? null
              : profile.tagline,
        address:
          typeof body.address === "string" ? body.address : body.address === null ? null : profile.address,
        contactPhone:
          typeof body.contactPhone === "string"
            ? body.contactPhone.slice(0, 32)
            : body.contactPhone === null
              ? null
              : profile.contactPhone,
        contactLine:
          typeof body.contactLine === "string"
            ? body.contactLine.slice(0, 120)
            : body.contactLine === null
              ? null
              : profile.contactLine,
        certSignerName:
          typeof body.certSignerName === "string"
            ? body.certSignerName.slice(0, 160)
            : profile.certSignerName,
        certSignatureUrl:
          typeof body.certSignatureUrl === "string"
            ? body.certSignatureUrl.slice(0, 512)
            : body.certSignatureUrl === null
              ? null
              : profile.certSignatureUrl,
        certTemplateNote:
          typeof body.certTemplateNote === "string" ? body.certTemplateNote : profile.certTemplateNote,
        promptPayPhone:
          typeof body.promptPayPhone === "string"
            ? body.promptPayPhone.slice(0, 20)
            : body.promptPayPhone === null
              ? null
              : profile.promptPayPhone,
        promptPayQrImageUrl:
          typeof body.promptPayQrImageUrl === "string"
            ? body.promptPayQrImageUrl.slice(0, 512)
            : body.promptPayQrImageUrl === null
              ? null
              : profile.promptPayQrImageUrl,
        bankName:
          typeof body.bankName === "string"
            ? body.bankName.slice(0, 120)
            : body.bankName === null
              ? null
              : profile.bankName,
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
        taxId:
          typeof body.taxId === "string" ? body.taxId.slice(0, 30) : body.taxId === null ? null : profile.taxId,
        slipPaperSize:
          typeof body.slipPaperSize === "string" ? body.slipPaperSize.slice(0, 16) : profile.slipPaperSize,
        financeCategoriesJson:
          body.financeCategories !== undefined
            ? (() => {
                const sanitized = sanitizeLmsFinanceCategories(body.financeCategories);
                if (sanitized === null) return profile.financeCategoriesJson;
                return JSON.stringify(sanitized).slice(0, 4000);
              })()
            : profile.financeCategoriesJson,
      },
    });

    return NextResponse.json({ profile: mapLmsProfile(updated) });
  } catch (e) {
    console.error("[lms/session/profile PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

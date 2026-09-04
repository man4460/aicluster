import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import type { ClubEventDuesPeriodKey } from "@/systems/club-event/lib/dues";
import { mapClubEventProfile } from "@/systems/club-event/lib/mappers";
import {
  parsePortalMemberFieldsJson,
  serializePortalMemberFields,
} from "@/systems/club-event/lib/portal-member-fields";
import { syncClubEventDuesPublicLink } from "@/systems/club-event/lib/sync-dues-link";

function parseDuesPeriod(raw: unknown): ClubEventDuesPeriodKey | null {
  if (raw === "MONTHLY" || raw === "QUARTERLY" || raw === "SEMIANNUAL" || raw === "YEARLY") {
    return raw;
  }
  return null;
}

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

    const duesEnabled =
      typeof body.duesEnabled === "boolean" ? body.duesEnabled : profile.duesEnabled;
    const duesAmountRaw =
      typeof body.duesAmountBaht === "number"
        ? body.duesAmountBaht
        : typeof body.duesAmountBaht === "string"
          ? Number(body.duesAmountBaht)
          : profile.duesAmountBaht;
    const duesAmountBaht = Math.max(0, Math.round(Number(duesAmountRaw) || 0));
    const duesPeriod = parseDuesPeriod(body.duesPeriod) ?? profile.duesPeriod;

    if (duesEnabled && duesAmountBaht <= 0) {
      return NextResponse.json({ error: "เปิดเก็บค่าบำรุงแล้วต้องระบุจำนวนเงินมากกว่า 0" }, { status: 400 });
    }

    const duesLinkId = await syncClubEventDuesPublicLink({
      prisma,
      profileId: profile.id,
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      duesEnabled,
      duesAmountBaht,
      duesPeriod,
      existingDuesLinkId: profile.duesLinkId,
    });

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
        address: typeof body.address === "string" ? body.address : body.address === null ? null : profile.address,
        facebookUrl:
          typeof body.facebookUrl === "string"
            ? body.facebookUrl.slice(0, 512)
            : body.facebookUrl === null
              ? null
              : profile.facebookUrl,
        mapUrl:
          typeof body.mapUrl === "string" ? body.mapUrl.slice(0, 512) : body.mapUrl === null ? null : profile.mapUrl,
        portalBannerUrl:
          typeof body.portalBannerUrl === "string"
            ? body.portalBannerUrl.slice(0, 512)
            : body.portalBannerUrl === null
              ? null
              : profile.portalBannerUrl,
        portalGalleryJson:
          body.portalGallery !== undefined
            ? JSON.stringify(
                Array.isArray(body.portalGallery)
                  ? body.portalGallery.filter((u): u is string => typeof u === "string").slice(0, 24)
                  : [],
              )
            : profile.portalGalleryJson,
        portalShowCommittee:
          typeof body.portalShowCommittee === "boolean"
            ? body.portalShowCommittee
            : profile.portalShowCommittee,
        portalShowMembers:
          typeof body.portalShowMembers === "boolean"
            ? body.portalShowMembers
            : profile.portalShowMembers,
        portalMemberFieldsJson:
          body.portalMemberFields !== undefined &&
          typeof body.portalMemberFields === "object" &&
          body.portalMemberFields !== null &&
          !Array.isArray(body.portalMemberFields)
            ? serializePortalMemberFields(
                parsePortalMemberFieldsJson(JSON.stringify(body.portalMemberFields)),
              )
            : profile.portalMemberFieldsJson,
        paymentRulesNote:
          typeof body.paymentRulesNote === "string" ? body.paymentRulesNote : profile.paymentRulesNote,
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
        taxId:
          typeof body.taxId === "string" ? body.taxId.slice(0, 30) : body.taxId === null ? null : profile.taxId,
        slipPaperSize: typeof body.slipPaperSize === "string" ? body.slipPaperSize.slice(0, 16) : profile.slipPaperSize,
        financeCategoriesJson:
          body.financeCategories !== undefined
            ? JSON.stringify(body.financeCategories).slice(0, 4000)
            : profile.financeCategoriesJson,
        duesEnabled,
        duesAmountBaht,
        duesPeriod,
        duesLinkId,
      },
    });

    return NextResponse.json({ profile: mapClubEventProfile(updated) });
  } catch (e) {
    console.error("[club-event/session/profile PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

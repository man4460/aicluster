import { NextResponse } from "next/server";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { prisma } from "@/lib/prisma";
import {
  composeClubEventMemberDisplayName,
  normalizeClubEventMemberGender,
} from "@/systems/club-event/lib/member-excel";
import {
  clubEventDuesPeriodForDate,
  normalizeClubPhoneDigits,
  type ClubEventDuesPeriodKey,
} from "@/systems/club-event/lib/dues";
import { mapClubEventMember } from "@/systems/club-event/lib/mappers";
import {
  resolvePortalSignupCollectDues,
  type ClubPortalSignupCollectDues,
} from "@/systems/club-event/lib/portal-signup";

type Ctx = { params: Promise<{ slug: string }> };

const PAY_METHODS = new Set(["PROMPTPAY", "TRANSFER", "CASH"]);

function parseDuesPeriod(raw: string): ClubEventDuesPeriodKey {
  if (raw === "MONTHLY" || raw === "QUARTERLY" || raw === "SEMIANNUAL" || raw === "YEARLY") return raw;
  return "YEARLY";
}

function signupPayload(profile: {
  ownerUserId: string;
  displayName: string;
  logoUrl: string | null;
  portalBannerUrl: string | null;
  slug: string;
  tagline: string | null;
  paymentRulesNote: string;
  duesEnabled: boolean;
  duesAmountBaht: number;
  duesPeriod: string;
  portalSignupEnabled: boolean;
  portalSignupCollectDues: string;
}) {
  const collectDues = resolvePortalSignupCollectDues({
    portalSignupCollectDues: profile.portalSignupCollectDues,
    duesEnabled: profile.duesEnabled,
    duesAmountBaht: profile.duesAmountBaht,
  });
  const period = parseDuesPeriod(profile.duesPeriod);
  const duesMeta =
    collectDues !== "OFF"
      ? {
          ...clubEventDuesPeriodForDate(period),
          amountBaht: Math.max(0, Math.round(Number(profile.duesAmountBaht) || 0)),
        }
      : null;

  return {
    ownerId: profile.ownerUserId,
    clubName: profile.displayName,
    logoUrl: profile.logoUrl,
    bannerUrl: profile.portalBannerUrl,
    slug: profile.slug,
    tagline: profile.tagline,
    paymentRulesNote: profile.paymentRulesNote ?? "",
    signupEnabled: Boolean(profile.portalSignupEnabled),
    collectDues,
    dues: duesMeta,
  };
}

/** โหลดการตั้งค่าหน้าสมัครสมาชิกสาธารณะ */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const profile = await findClubEventPublicProfile(slug, trialParam);
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }
    if (!profile.portalSignupEnabled) {
      return NextResponse.json({ error: "ยังไม่เปิดรับสมัครสมาชิกออนไลน์" }, { status: 403 });
    }
    return NextResponse.json(signupPayload(profile));
  } catch (e) {
    console.error("[club-event/public signup GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

/** สมัครสมาชิกจากเว็บสาธารณะ (+ ชำระค่าบำรุงถ้าตั้งค่า) */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const profile = await findClubEventPublicProfile(slug, trialParam);
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }
    if (!profile.portalSignupEnabled) {
      return NextResponse.json({ error: "ยังไม่เปิดรับสมัครสมาชิกออนไลน์" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : "";
    const nickname = typeof body.nickname === "string" ? body.nickname.trim().slice(0, 80) : "";
    const gender = normalizeClubEventMemberGender(typeof body.gender === "string" ? body.gender : "");
    const phoneRaw = typeof body.phone === "string" ? body.phone : "";
    const phone = phoneRaw.replace(/\D/g, "").slice(0, 32);
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
    const social = typeof body.social === "string" ? body.social.trim().slice(0, 300) : "";
    const position = typeof body.position === "string" ? body.position.trim().slice(0, 120) : "";
    const photoUrl =
      typeof body.photoUrl === "string" && body.photoUrl.startsWith("/uploads/")
        ? body.photoUrl.slice(0, 512)
        : null;
    const dataConsent = body.dataConsent === true;
    const payDuesNow = body.payDuesNow === true;
    const paymentMethod =
      typeof body.paymentMethod === "string" && PAY_METHODS.has(body.paymentMethod)
        ? body.paymentMethod
        : null;
    const slipUrl =
      typeof body.slipUrl === "string" && body.slipUrl.startsWith("/uploads/")
        ? body.slipUrl.slice(0, 512)
        : null;

    const name = composeClubEventMemberDisplayName(firstName, lastName);
    if (!firstName && !name) {
      return NextResponse.json({ error: "กรอกชื่อ" }, { status: 400 });
    }
    if (phone.length < 9) {
      return NextResponse.json({ error: "กรอกเบอร์โทรให้ถูกต้อง" }, { status: 400 });
    }
    if (!dataConsent) {
      return NextResponse.json({ error: "ต้องยินยอมเก็บข้อมูลส่วนบุคคลก่อนสมัคร" }, { status: 400 });
    }

    const collectDues = resolvePortalSignupCollectDues({
      portalSignupCollectDues: profile.portalSignupCollectDues,
      duesEnabled: profile.duesEnabled,
      duesAmountBaht: profile.duesAmountBaht,
    });
    const shouldPay =
      collectDues === "REQUIRED" || (collectDues === "OPTIONAL" && payDuesNow);
    const duesAmount = Math.max(0, Math.round(Number(profile.duesAmountBaht) || 0));

    if (shouldPay) {
      if (duesAmount <= 0) {
        return NextResponse.json({ error: "ยังไม่ได้ตั้งจำนวนค่าบำรุง" }, { status: 400 });
      }
      if (!paymentMethod) {
        return NextResponse.json({ error: "เลือกวิธีชำระเงิน" }, { status: 400 });
      }
      if ((paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && !slipUrl) {
        return NextResponse.json({ error: "แนบสลิปการชำระเงิน" }, { status: 400 });
      }
    }

    const existing = await prisma.clubEventMember.findMany({
      where: {
        profileId: profile.id,
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        isActive: true,
      },
      select: { id: true, phone: true },
      take: 3000,
    });
    const phoneDigits = normalizeClubPhoneDigits(phone);
    if (existing.some((m) => normalizeClubPhoneDigits(m.phone) === phoneDigits)) {
      return NextResponse.json(
        { error: "เบอร์นี้เป็นสมาชิกอยู่แล้ว — ติดต่อชมรมหากต้องการชำระค่าบำรุง" },
        { status: 409 },
      );
    }

    const displayName =
      name ||
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      firstName;

    const member = await prisma.clubEventMember.create({
      data: {
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        profileId: profile.id,
        name: displayName.slice(0, 160),
        firstName: firstName || displayName.split(/\s+/)[0]!.slice(0, 80),
        lastName:
          lastName ||
          (displayName.includes(" ")
            ? displayName.split(/\s+/).slice(1).join(" ").slice(0, 80)
            : ""),
        nickname,
        gender,
        phone,
        photoUrl,
        position,
        email,
        social,
        memberCode: "",
        dataConsent: true,
        customFieldsJson: "[]",
        isActive: true,
      },
    });

    let duesPaid = false;
    if (shouldPay && duesAmount > 0 && paymentMethod) {
      const period = parseDuesPeriod(profile.duesPeriod);
      const { periodKey, periodLabel } = clubEventDuesPeriodForDate(period);

      await prisma.$transaction([
        prisma.clubEventFinanceTransaction.create({
          data: {
            ownerUserId: profile.ownerUserId,
            trialSessionId: profile.trialSessionId,
            profileId: profile.id,
            type: "INCOME",
            category: "ค่าบำรุงสมาชิก",
            amountBaht: duesAmount,
            transactedAt: new Date(),
            note: `สมัครสมาชิก · ${displayName}`,
            slipUrl,
          },
        }),
        prisma.clubEventDuesPayment.create({
          data: {
            ownerUserId: profile.ownerUserId,
            trialSessionId: profile.trialSessionId,
            profileId: profile.id,
            memberId: member.id,
            payerName: displayName.slice(0, 160),
            payerPhone: phone,
            memberCode: "",
            amountBaht: duesAmount,
            periodKey,
            periodLabel,
            paymentMethod,
            slipUrl,
            source: "SIGNUP",
            note: "ชำระตอนสมัครสมาชิกออนไลน์",
            paidAt: new Date(),
          },
        }),
      ]);
      duesPaid = true;
    }

    return NextResponse.json({
      ok: true,
      member: mapClubEventMember(member),
      duesPaid,
      collectDues: collectDues as ClubPortalSignupCollectDues,
    });
  } catch (e) {
    console.error("[club-event/public signup POST]", e);
    return NextResponse.json({ error: "สมัครไม่สำเร็จ" }, { status: 500 });
  }
}

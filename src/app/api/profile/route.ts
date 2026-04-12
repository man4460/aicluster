import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import {
  applyReferrerFromProfileInTx,
  referralProfileErrorMessage,
} from "@/lib/auth/apply-profile-referral";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { isDemoSessionUsername } from "@/lib/auth/demo-account";

const patchSchema = z.object({
  fullName: z.string().max(255).optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  address: z.string().max(5000).optional().nullable(),
  taxId: z.string().max(30).optional().nullable(),
  promptPayPhone: z.string().max(20).optional().nullable(),
  paymentChannelsNote: z.string().max(8000).optional().nullable(),
  defaultPaperSize: z.enum(["SLIP_58", "SLIP_80", "A4"]).optional(),
  latitude: z.number().finite().optional().nullable(),
  longitude: z.number().finite().optional().nullable(),
  /** เบอร์ผู้แนะนำ — บันทึกได้ครั้งเดียวต่อบัญชี (ตรงกับ phone ในโปรไฟล์ผู้แนะนำ) */
  referrerPhone: z.string().max(32).optional(),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, prodDorm, barberScope] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.session.sub },
      select: {
        email: true,
        username: true,
        fullName: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        avatarUrl: true,
        tokens: true,
        subscriptionTier: true,
        referredByUserId: true,
        referredBy: { select: { phone: true, username: true } },
      },
    }),
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: auth.session.sub,
          trialSessionId: TRIAL_PROD_SCOPE,
        },
      },
      select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
    }),
    getBarberDataScope(auth.session.sub),
  ]);

  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  const business = await getBusinessProfile(auth.session.sub, {
    barberTrialSessionId: barberScope.trialSessionId,
  });
  const { referredBy, ...userRest } = user;
  const referrerSummary =
    user.referredByUserId && referredBy
      ? referredBy.phone?.trim() || (referredBy.username ? `@${referredBy.username}` : null)
      : null;

  return NextResponse.json({
    profile: {
      ...userRest,
      taxId: business?.taxId ?? null,
      promptPayPhone: prodDorm?.promptPayPhone ?? null,
      paymentChannelsNote: prodDorm?.paymentChannelsNote ?? null,
      defaultPaperSize: prodDorm?.defaultPaperSize ?? "SLIP_58",
      referrerLocked: Boolean(user.referredByUserId),
      referrerSummary,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const data = parsed.data;
  const barberScope = await getBarberDataScope(auth.session.sub);

  const me = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: { referredByUserId: true, phone: true },
  });
  if (!me) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const referrerRaw =
    data.referrerPhone !== undefined ? String(data.referrerPhone).trim() : "";
  if (referrerRaw.length > 0 && isDemoSessionUsername(auth.session.username)) {
    return NextResponse.json(
      { error: "บัญชีทดลองใช้งานไม่สามารถบันทึกเบอร์ผู้แนะนำได้" },
      { status: 403 },
    );
  }
  if (referrerRaw.length > 0 && me.referredByUserId) {
    return NextResponse.json({ error: referralProfileErrorMessage("REFERRER_ALREADY_SET") }, { status: 400 });
  }

  const refereePhoneForReferral =
    data.phone !== undefined ? data.phone : me.phone;

  const hasUserScalarUpdate =
    data.fullName !== undefined ||
    data.phone !== undefined ||
    data.address !== undefined ||
    data.latitude !== undefined ||
    data.longitude !== undefined;

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      let updated = await tx.user.findUnique({
        where: { id: auth.session.sub },
        select: {
          email: true,
          username: true,
          fullName: true,
          phone: true,
          address: true,
          latitude: true,
          longitude: true,
          avatarUrl: true,
          tokens: true,
          subscriptionTier: true,
          referredByUserId: true,
        },
      });
      if (!updated) throw new Error("USER_NOT_FOUND");

      if (hasUserScalarUpdate) {
        updated = await tx.user.update({
          where: { id: auth.session.sub },
          data: {
            ...(data.fullName !== undefined && { fullName: data.fullName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.latitude !== undefined && { latitude: data.latitude }),
            ...(data.longitude !== undefined && { longitude: data.longitude }),
          },
          select: {
            email: true,
            username: true,
            fullName: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
            avatarUrl: true,
            tokens: true,
            subscriptionTier: true,
            referredByUserId: true,
          },
        });
      }

      if (referrerRaw.length > 0) {
        await applyReferrerFromProfileInTx(
          tx,
          auth.session.sub,
          refereePhoneForReferral,
          referrerRaw,
        );
      }

    if (data.taxId !== undefined) {
      await tx.barberShopProfile.upsert({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: auth.session.sub,
            trialSessionId: barberScope.trialSessionId,
          },
        },
        create: {
          ownerUserId: auth.session.sub,
          trialSessionId: barberScope.trialSessionId,
          taxId: data.taxId,
        },
        update: { taxId: data.taxId },
      });
    }
    if (
      data.promptPayPhone !== undefined ||
      data.paymentChannelsNote !== undefined ||
      data.defaultPaperSize !== undefined
    ) {
      const normalizePromptPay = (raw: string | null | undefined) => {
        if (raw == null) return null;
        const d = raw.replace(/\D/g, "").slice(0, 15);
        return d.length > 0 ? d : null;
      };
      await tx.dormitoryProfile.upsert({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: auth.session.sub,
            trialSessionId: TRIAL_PROD_SCOPE,
          },
        },
        create: {
          ownerUserId: auth.session.sub,
          trialSessionId: TRIAL_PROD_SCOPE,
          defaultPaperSize: data.defaultPaperSize ?? "SLIP_58",
          promptPayPhone: normalizePromptPay(data.promptPayPhone),
          paymentChannelsNote: data.paymentChannelsNote ?? null,
        },
        update: {
          ...(data.defaultPaperSize !== undefined
            ? { defaultPaperSize: data.defaultPaperSize }
            : {}),
          ...(data.promptPayPhone !== undefined
            ? { promptPayPhone: normalizePromptPay(data.promptPayPhone) }
            : {}),
          ...(data.paymentChannelsNote !== undefined
            ? { paymentChannelsNote: data.paymentChannelsNote }
            : {}),
        },
      });
    }

      const [tax, dorm, referredBy] = await Promise.all([
        tx.barberShopProfile.findUnique({
          where: {
            ownerUserId_trialSessionId: {
              ownerUserId: auth.session.sub,
              trialSessionId: barberScope.trialSessionId,
            },
          },
          select: { taxId: true },
        }),
        tx.dormitoryProfile.findUnique({
          where: {
            ownerUserId_trialSessionId: {
              ownerUserId: auth.session.sub,
              trialSessionId: TRIAL_PROD_SCOPE,
            },
          },
          select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
        }),
        tx.user.findUnique({
          where: { id: auth.session.sub },
          select: {
            referredByUserId: true,
            referredBy: { select: { phone: true, username: true } },
          },
        }),
      ]);

      const refSummary =
        referredBy?.referredByUserId && referredBy.referredBy
          ? referredBy.referredBy.phone?.trim() ||
            (referredBy.referredBy.username ? `@${referredBy.referredBy.username}` : null)
          : null;

      return {
        ...updated,
        referredByUserId: referredBy?.referredByUserId ?? updated.referredByUserId,
        taxId: tax?.taxId ?? null,
        promptPayPhone: dorm?.promptPayPhone ?? null,
        paymentChannelsNote: dorm?.paymentChannelsNote ?? null,
        defaultPaperSize: dorm?.defaultPaperSize ?? "SLIP_58",
        referrerLocked: Boolean(referredBy?.referredByUserId),
        referrerSummary: refSummary,
      };
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    if (
      code === "REFERRER_NOT_FOUND" ||
      code === "REFERRER_SELF" ||
      code === "REFERRER_SAME_PHONE" ||
      code === "REFERRER_ALREADY_SET"
    ) {
      return NextResponse.json({ error: referralProfileErrorMessage(code) }, { status: 400 });
    }
    throw e;
  }

  return NextResponse.json({ profile: user });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    let trialSessionId = TRIAL_PROD_SCOPE;
    const t = parsed.data.t?.trim();
    if (t) {
      const trial = await prisma.trialSession.findFirst({
        where: { id: t, status: "ACTIVE", expiresAt: { gt: new Date() } },
        select: { id: true },
      });
      if (trial) trialSessionId = t;
    }

    const profile = await prisma.clubEventProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: parsed.data.ownerId,
          trialSessionId,
        },
      },
      select: {
        displayName: true,
        promptPayPhone: true,
        promptPayQrImageUrl: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(
      parsed.data.ownerId,
      CLUB_EVENT_MODULE_SLUG,
    );
    if (!charge.ok) {
      return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
    }

    const phone = profile.promptPayPhone?.trim() ?? "";
    const digits = phone.replace(/\D/g, "");
    const staticQr = profile.promptPayQrImageUrl?.trim() || null;
    const bankPayload = {
      promptPayPhone: phone || null,
      bankName: profile.bankName ?? null,
      bankAccountNumber: profile.bankAccountNumber ?? null,
      bankAccountName: profile.bankAccountName ?? null,
      shopName: profile.displayName ?? null,
    };

    if (staticQr) {
      return NextResponse.json({
        qrDataUrl: staticQr,
        configured: true,
        ...bankPayload,
      });
    }

    if (digits.length < 9) {
      return NextResponse.json({
        qrDataUrl: null as string | null,
        configured: false,
        ...bankPayload,
      });
    }

    const qrDataUrl = await buildPromptPayQrDataUrl(digits, parsed.data.amountBaht);
    return NextResponse.json({
      qrDataUrl,
      configured: Boolean(qrDataUrl),
      ...bankPayload,
    });
  } catch (e) {
    console.error("[club-event/public/promptpay-qr]", e);
    return NextResponse.json({ error: "สร้าง QR ไม่สำเร็จ" }, { status: 500 });
  }
}

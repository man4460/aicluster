import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`massage-portal-ppqr:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ถี่เกินไป" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const open = await isMassageCustomerPortalOpenForOwner(parsed.data.ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(
    parsed.data.ownerId,
    parsed.data.t,
  );

  const profile = await prisma.massageShopProfile.findUnique({
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

  const phone = profile?.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const staticQr = profile?.promptPayQrImageUrl?.trim() || null;
  const bankPayload = {
    promptpayNumber: phone || null,
    bankName: profile?.bankName ?? null,
    accountNumber: profile?.bankAccountNumber ?? null,
    accountName: profile?.bankAccountName ?? null,
    shopName: profile?.displayName ?? null,
  };

  if (staticQr) {
    return NextResponse.json({
      qrDataUrl: staticQr,
      configured: true,
      qrSource: "uploaded" as const,
      ...bankPayload,
    });
  }

  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
      qrSource: "none" as const,
      ...bankPayload,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    qrSource: "generated" as const,
    ...bankPayload,
  });
}

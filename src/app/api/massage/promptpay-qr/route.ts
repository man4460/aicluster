import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { massageOwnerFromAuth } from "@/lib/massage/api-owner";
import { getMassageDataScope } from "@/lib/trial/module-scopes";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
});

/** QR พร้อมเพย์ + ข้อมูลบัญชีโอนจากโปรไฟล์ร้านนวด */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getMassageDataScope(own.ownerId);
  const trialSessionId = scope.trialSessionId;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }
  const amount = parsed.data.amountBaht ?? parsed.data.amount;
  if (amount == null) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }

  const profile = await prisma.massageShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId },
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
    promptPayPhone: phone || null,
    bankName: profile?.bankName ?? null,
    bankAccountNumber: profile?.bankAccountNumber ?? null,
    bankAccountName: profile?.bankAccountName ?? null,
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

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, amount);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    qrSource: "generated" as const,
    ...bankPayload,
  });
}

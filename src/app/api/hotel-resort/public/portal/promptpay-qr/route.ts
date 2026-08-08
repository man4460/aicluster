import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

/** QR พร้อมเพย์ / ข้อมูลโอน — ลิงก์ลูกค้าจองโรงแรม */
export async function POST(req: Request) {
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

  const open = await isHotelResortPortalOpenForOwner(parsed.data.ownerId);
  if (!open) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }

  const trialSessionId =
    parsed.data.t && parsed.data.t.trim().length > 0 ? parsed.data.t.trim() : TRIAL_PROD_SCOPE;

  const profile = await prisma.hotelResortProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: parsed.data.ownerId,
        trialSessionId,
      },
    },
    select: {
      propertyName: true,
      promptPayPhone: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
    },
  });

  const phone = profile?.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const bankPayload = {
    promptPayPhone: phone || null,
    bankName: profile?.bankName ?? null,
    bankAccountNumber: profile?.bankAccountNumber ?? null,
    bankAccountName: profile?.bankAccountName ?? null,
    shopName: profile?.propertyName ?? null,
  };

  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
      ...bankPayload,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    ...bankPayload,
  });
}

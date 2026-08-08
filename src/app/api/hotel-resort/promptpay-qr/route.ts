import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerOrStaffContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
});

/** QR พร้อมเพย์ + ข้อมูลบัญชีโอนจากโปรไฟล์โรงแรม */
export async function POST(req: Request) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

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

  await ensureHotelResortProfile(prisma, ownerUserId, trialSessionId);
  const profile = await prisma.hotelResortProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
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

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, amount);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    ...bankPayload,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { resolvePublicLaundryTrialSessionId } from "@/lib/laundry/public-trial-scope";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

/** QR พร้อมเพย์ / ข้อมูลโอน — ลิงก์ลูกค้ารับผ้าที่บ้าน */
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

    const open = await isLaundryPickupPortalOpenForOwner(parsed.data.ownerId);
    if (!open) {
      return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
    }

    const { trialSessionId } = await resolvePublicLaundryTrialSessionId(
      parsed.data.ownerId,
      parsed.data.t?.trim() || null,
    );

    const profile = await prisma.laundryShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: parsed.data.ownerId, trialSessionId },
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
    return jsonLaundrySessionError(e, "laundry/public/promptpay-qr POST");
  }
}

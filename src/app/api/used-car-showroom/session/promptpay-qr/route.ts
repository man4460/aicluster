import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);

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

    const phone = shop.promptPayPhone?.trim() ?? "";
    const digits = phone.replace(/\D/g, "");
    const staticQr = shop.promptPayQrImageUrl?.trim() || null;
    const bankPayload = {
      promptPayPhone: phone || null,
      bankName: shop.bankName ?? null,
      bankAccountNumber: shop.bankAccountNumber ?? null,
      bankAccountName: shop.bankAccountName ?? null,
      shopName: shop.displayName ?? null,
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
  } catch (e) {
    console.error("[used-car-showroom/session/promptpay-qr]", e);
    return NextResponse.json({ error: "สร้าง QR ไม่สำเร็จ" }, { status: 500 });
  }
}

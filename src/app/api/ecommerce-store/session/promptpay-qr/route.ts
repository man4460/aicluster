import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
});

export async function POST(req: Request) {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;

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

  const store = await getOrCreateEcommerceStore(auth.ctx.ownerUserId);
  const phone = store.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const bankPayload = {
    promptPayPhone: phone || null,
    bankName: store.bankName ?? null,
    bankAccountNumber: store.bankAccountNumber ?? null,
    bankAccountName: store.bankAccountName ?? null,
    shopName: store.storeName ?? null,
  };

  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
      qrSource: "none" as const,
      ...bankPayload,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(digits, amount);
  if (!qrDataUrl) {
    return NextResponse.json({ error: "สร้าง QR ไม่สำเร็จ" }, { status: 400 });
  }

  return NextResponse.json({
    qrDataUrl,
    configured: true,
    qrSource: "generated" as const,
    amountBaht: amount,
    ...bankPayload,
  });
}

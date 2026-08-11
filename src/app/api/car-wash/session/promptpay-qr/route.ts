import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
});

/** QR พร้อมเพย์ + ข้อมูลบัญชีโอนจากตั้งค่าโมดูลคาร์แคร์ */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

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

  const scope = await getCarWashDataScope(own.ownerId);
  const branding = await getModuleShopBranding(own.ownerId, scope.trialSessionId, CAR_WASH_MODULE_SLUG);
  const phone = branding.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const bankPayload = {
    promptPayPhone: phone || null,
    bankName: branding.bankName ?? null,
    bankAccountNumber: branding.bankAccountNumber ?? null,
    bankAccountName: branding.bankAccountName ?? null,
    shopName: branding.displayName ?? null,
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

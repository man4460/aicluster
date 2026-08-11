import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { getQrCarWashBranding } from "@/lib/profile/qr-branding";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`car-wash-portal-ppqr:${ip}`, 40, 10 * 60 * 1000);
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

  const open = await isCarWashCustomerPortalOpenForOwner(parsed.data.ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(
    parsed.data.ownerId,
    parsed.data.t,
  );

  const [branding, paymentRow, modulePayment] = await Promise.all([
    getQrCarWashBranding(parsed.data.ownerId, trialSessionId),
    prisma.moduleShopBranding.findUnique({
      where: {
        ownerUserId_trialSessionId_moduleSlug: {
          ownerUserId: parsed.data.ownerId,
          trialSessionId,
          moduleSlug: CAR_WASH_MODULE_SLUG,
        },
      },
      select: MODULE_SHOP_PAYMENT_SELECT,
    }),
    resolveModulePayment(parsed.data.ownerId, trialSessionId, CAR_WASH_MODULE_SLUG),
  ]);

  const pay = paymentRowToDto(paymentRow);
  const phone = modulePayment.promptPayPhone?.trim() || pay.promptPayPhone?.trim() || "";
  const digits = phone.replace(/\D/g, "");
  const bankPayload = {
    promptpayNumber: phone || null,
    bankName: pay.bankName ?? null,
    accountNumber: pay.bankAccountNumber ?? null,
    accountName: pay.bankAccountName ?? null,
    shopName: branding.label || null,
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

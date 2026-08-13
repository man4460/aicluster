import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

/** QR พร้อมเพย์ / ข้อมูลโอน — ลิงก์ลูกค้าจองร้านอาหาร */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`bpos-portal-ppqr:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ถี่เกินไป" }, { status: 429 });

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

  const open = await isBuildingPosPortalOpenForOwner(parsed.data.ownerId);
  if (!open) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }

  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(
    parsed.data.ownerId,
    parsed.data.t,
  );

  const branding = await getModuleShopBranding(
    parsed.data.ownerId,
    trialSessionId,
    BUILDING_POS_MODULE_SLUG,
  );

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

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    ...bankPayload,
  });
}

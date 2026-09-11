import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { prisma } from "@/lib/prisma";
import { gateUsedCarShowroomPublicShop } from "@/systems/used-car-showroom/lib/load-public-shop";

const bodySchema = z.object({
  slug: z.string().trim().min(2).max(80).optional(),
  ownerId: z.string().trim().min(10).max(191).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

/** QR พร้อมเพย์ / ข้อมูลโอน — เว็บจองรถ */
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

    let shop = null as Awaited<ReturnType<typeof prisma.usedCarShowroomShop.findFirst>>;

    if (parsed.data.slug) {
      const gate = await gateUsedCarShowroomPublicShop(parsed.data.slug, parsed.data.t ?? null);
      if (!gate.ok) {
        return NextResponse.json({ error: gate.error }, { status: gate.status });
      }
      shop = gate.shop;
    } else if (parsed.data.ownerId) {
      const trialSessionId = (parsed.data.t?.trim() || "prod").slice(0, 36);
      shop = await prisma.usedCarShowroomShop.findFirst({
        where: {
          ownerUserId: parsed.data.ownerId,
          trialSessionId,
          portalEnabled: true,
        },
      });
      if (!shop) {
        return NextResponse.json({ error: "ไม่พบโชว์รูม" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "ระบุ slug หรือ ownerId" }, { status: 400 });
    }

    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(
      shop.ownerUserId,
      USED_CAR_SHOWROOM_MODULE_SLUG,
    );
    if (!charge.ok) {
      return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
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
    console.error("[used-car-showroom/public/promptpay-qr]", e);
    return NextResponse.json({ error: "สร้าง QR ไม่สำเร็จ" }, { status: 500 });
  }
}

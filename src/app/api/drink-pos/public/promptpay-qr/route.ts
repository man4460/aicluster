import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

/** QR พร้อมเพย์ / ข้อมูลโอน — ลิงก์ลูกค้าสั่งเครื่องดื่ม */
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

  const open = await isDrinkPosPortalOpenForOwner(parsed.data.ownerId);
  if (!open) {
    return NextResponse.json({ error: "ร้านปิดรับออเดอร์ชั่วคราว" }, { status: 403 });
  }

  const scope = await getDrinkPosDataScope(parsed.data.ownerId);
  const trialSessionId =
    parsed.data.t && parsed.data.t.length > 0 ? parsed.data.t : scope.trialSessionId;
  const profile = await ensureDrinkPosShopProfile(prisma, parsed.data.ownerId, trialSessionId);
  const full = await prisma.drinkPosShopProfile.findUnique({
    where: { id: profile.id },
    select: {
      promptPayPhone: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
      displayName: true,
    },
  });

  const phone = full?.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
      promptPayPhone: phone || null,
      bankName: full?.bankName ?? null,
      bankAccountNumber: full?.bankAccountNumber ?? null,
      bankAccountName: full?.bankAccountName ?? null,
      shopName: full?.displayName ?? null,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    promptPayPhone: phone,
    bankName: full?.bankName ?? null,
    bankAccountNumber: full?.bankAccountNumber ?? null,
    bankAccountName: full?.bankAccountName ?? null,
    shopName: full?.displayName ?? null,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

const bodySchema = z.object({
  amountBaht: z.number().finite().positive().max(9_999_999.99),
});

/** QR พร้อมเพย์ตามยอด — อ่านเบอร์จากตั้งค่าร้าน POS เครื่องดื่ม */
export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
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

  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const profile = await ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId);
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
      promptPayPhone: phone,
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

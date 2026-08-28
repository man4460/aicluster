import { NextResponse } from "next/server";
import { z } from "zod";
import { withDormitoryOwnerOrStaffContext } from "@/lib/dormitory/api-auth";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { resolveDormInvoiceBranding } from "@/lib/dormitory/resolve-dorm-invoice-branding";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99).optional(),
  amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
});

/** QR พร้อมเพย์ + ข้อมูลบัญชีโอนจากโปรไฟล์หอพัก */
export async function POST(req: Request) {
  const auth = await withDormitoryOwnerOrStaffContext(req);
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

  const [branding, profile] = await Promise.all([
    resolveDormInvoiceBranding(ownerUserId, trialSessionId),
    prisma.dormitoryProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: {
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    }),
  ]);

  const phone = branding.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const bankPayload = {
    promptPayPhone: phone || null,
    bankName: profile?.bankName ?? null,
    bankAccountNumber: profile?.bankAccountNumber ?? null,
    bankAccountName: profile?.bankAccountName ?? null,
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

const schema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (!(await isParkingPortalOpenForOwner(parsed.data.ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const trialSessionId = parsed.data.t?.trim() || TRIAL_PROD_SCOPE;
  const site = await prisma.parkingSite.findFirst({
    where: { ownerUserId: parsed.data.ownerId, trialSessionId, isActive: true },
    orderBy: { id: "asc" },
    select: {
      name: true,
      promptPayPhone: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
    },
  });
  const phone = site?.promptPayPhone?.trim() ?? "";
  const qrDataUrl = phone.replace(/\D/g, "").length >= 9
    ? await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht)
    : null;
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    promptPayPhone: phone || null,
    bankName: site?.bankName ?? null,
    bankAccountNumber: site?.bankAccountNumber ?? null,
    bankAccountName: site?.bankAccountName ?? null,
    shopName: site?.name ?? null,
  });
}

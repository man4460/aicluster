import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().trim().min(1).max(64),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
});

export async function POST(req: Request) {
  const limited = rateLimit(`parking-public-qr:${clientIp(req.headers)}`, 40, 10 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "ถี่เกินไป" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const spot = await prisma.parkingSpot.findUnique({
    where: { checkInToken: parsed.data.token },
    include: { site: true },
  });
  if (!spot) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 404 });
  const phone = spot.site.promptPayPhone?.trim() ?? "";
  const qrDataUrl = phone.replace(/\D/g, "").length >= 9
    ? await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht)
    : null;
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    promptPayPhone: phone || null,
    bankName: spot.site.bankName,
    bankAccountNumber: spot.site.bankAccountNumber,
    bankAccountName: spot.site.bankAccountName,
    shopName: spot.site.name,
  });
}

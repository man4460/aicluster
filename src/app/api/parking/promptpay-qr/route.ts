import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

const schema = z.object({ amountBaht: z.number().finite().positive().max(9_999_999.99) });

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  const phone = ctx.site.promptPayPhone?.trim() ?? "";
  const qrDataUrl = phone.replace(/\D/g, "").length >= 9
    ? await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht)
    : null;
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    promptPayPhone: phone || null,
    bankName: ctx.site.bankName,
    bankAccountNumber: ctx.site.bankAccountNumber,
    bankAccountName: ctx.site.bankAccountName,
    shopName: ctx.site.name,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";

const bodySchema = z
  .object({
    amount: z.number().finite().positive().max(9_999_999.99).optional(),
    amountBaht: z.number().finite().positive().max(9_999_999.99).optional(),
  })
  .refine((d) => d.amount !== undefined || d.amountBaht !== undefined, {
    message: "amount required",
  });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await ctx.params;
  const id = storeId?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

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

  const amount = Math.round((parsed.data.amount ?? parsed.data.amountBaht!) * 100) / 100;

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    select: { promptPayPhone: true },
  });
  const phone = store?.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) {
    return NextResponse.json({ qrDataUrl: null, configured: false });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, amount);
  if (!qrDataUrl) {
    return NextResponse.json({ error: "สร้าง QR ไม่สำเร็จ" }, { status: 400 });
  }

  return NextResponse.json({ qrDataUrl, amountBaht: amount, configured: true });
}

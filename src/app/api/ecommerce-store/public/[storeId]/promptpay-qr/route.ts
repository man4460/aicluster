import { NextResponse } from "next/server";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";

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

  const body = (await req.json()) as { amountBaht?: number };
  const amount = Number(body.amountBaht);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    select: { promptPayPhone: true },
  });
  const phone = store?.promptPayPhone?.trim() ?? "";
  if (!phone) return NextResponse.json({ error: "ร้านยังไม่ได้ตั้ง PromptPay" }, { status: 400 });

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, amount);
  if (!qrDataUrl) return NextResponse.json({ error: "สร้าง QR ไม่สำเร็จ" }, { status: 400 });

  return NextResponse.json({ qrDataUrl, amountBaht: amount });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
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

  const payment = await resolveModulePayment(
    auth.ctx.ownerUserId,
    auth.ctx.trialSessionId,
    HOTEL_RESORT_MODULE_SLUG,
  );
  const phone = payment.promptPayPhone?.trim() ?? "";
  if (phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ qrDataUrl: null, configured: false });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amount);
  return NextResponse.json({ qrDataUrl, configured: true });
}

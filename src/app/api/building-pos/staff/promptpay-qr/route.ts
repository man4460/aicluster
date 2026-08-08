import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { requireBuildingPosStaff } from "@/lib/building-pos/staff-auth";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

export async function POST(req: Request) {
  const auth = await requireBuildingPosStaff(req);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
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

  const payment = await resolveModulePayment(ctx.ownerId, ctx.trialSessionId, BUILDING_POS_MODULE_SLUG);
  const phone = payment.promptPayPhone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amount);
  return NextResponse.json({
    qrDataUrl,
    configured: true,
  });
}

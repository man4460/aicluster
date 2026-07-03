import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

/** สร้าง Data URL ของ QR พร้อมเพย์ — อ่านเบอร์จากตั้งค่าโมดูล POS ร้านอาหาร */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

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

  const scope = await getBuildingPosDataScope(own.ownerId);
  const payment = await resolveModulePayment(own.ownerId, scope.trialSessionId, BUILDING_POS_MODULE_SLUG);
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

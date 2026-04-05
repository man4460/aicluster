import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

/** QR พร้อมเพย์ตามยอดบาท — อ่านเบอร์จากโปรไฟล์หอพัก (prod) เหมือน POS */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
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

  const dorm = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: TRIAL_PROD_SCOPE },
    },
    select: { promptPayPhone: true },
  });
  const phone = dorm?.promptPayPhone?.trim() ?? "";
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

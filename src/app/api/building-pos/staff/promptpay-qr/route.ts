import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

export async function POST(req: Request) {
  const ctx = await resolveBuildingPosStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      ownerUserId_trialSessionId: { ownerUserId: ctx.ownerId, trialSessionId: TRIAL_PROD_SCOPE },
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

/** QR พร้อมเพย์ตามยอดบาท — ใช้รูปอัปโหลดถ้ามี ไม่งั้นสร้างจากเบอร์ */
export async function POST(req: Request) {
  const gate = await getFootballTurfOwnerOrStaffContext(req);
  if (!gate.ok) return gate.res;

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

  const repo = createFootballTurfServerRepo(gate.userId, gate.trialSessionId);
  const settings = await repo.getSettings();
  const phone = settings.promptpayNumber?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const staticQr = settings.promptPayQrImageUrl?.trim() || null;
  const bankPayload = {
    promptpayNumber: phone || null,
    bankName: settings.bankName || null,
    accountNumber: settings.accountNumber || null,
    accountName: settings.accountName || null,
    shopName: settings.venueName || null,
  };

  if (staticQr) {
    return NextResponse.json({
      qrDataUrl: staticQr,
      configured: true,
      qrSource: "uploaded" as const,
      ...bankPayload,
    });
  }

  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
      qrSource: "none" as const,
      ...bankPayload,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amount);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    qrSource: "generated" as const,
    ...bankPayload,
  });
}

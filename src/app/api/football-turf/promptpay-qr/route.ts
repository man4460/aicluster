import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

const bodySchema = z.object({
  amount: z.number().finite().positive().max(9_999_999.99),
});

/** QR พร้อมเพย์ตามยอดบาท — อ่านเบอร์จากตั้งค่าสนามฟุตบอล */
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
  if (digits.length < 9) {
    return NextResponse.json({
      qrDataUrl: null as string | null,
      configured: false,
      promptpayNumber: phone,
    });
  }

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amount);
  return NextResponse.json({
    qrDataUrl,
    configured: true,
    promptpayNumber: phone,
  });
}

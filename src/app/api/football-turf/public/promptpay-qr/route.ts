import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolvePublicFootballTurfTrialSessionId } from "@/lib/football-turf/public-trial-scope";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  amountBaht: z.number().finite().positive().max(9_999_999.99),
  t: z.string().trim().max(36).optional().nullable(),
});

/** QR พร้อมเพย์ — ลิงก์ลูกค้าจองสนาม (รูปอัปโหลดมาก่อนสร้างจากเบอร์) */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const open = await isFootballTurfPortalOpenForOwner(parsed.data.ownerId);
  if (!open) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }

  const { trialSessionId } = await resolvePublicFootballTurfTrialSessionId(
    parsed.data.ownerId,
    parsed.data.t,
  );
  await ensureFootballTurfProfile(parsed.data.ownerId, trialSessionId);
  const repo = createFootballTurfServerRepo(parsed.data.ownerId, trialSessionId);
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

  const qrDataUrl = await buildPromptPayQrDataUrl(phone, parsed.data.amountBaht);
  return NextResponse.json({
    qrDataUrl,
    configured: Boolean(qrDataUrl),
    qrSource: "generated" as const,
    ...bankPayload,
  });
}

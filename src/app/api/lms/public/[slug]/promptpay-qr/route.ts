import { NextResponse } from "next/server";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string }> };

/** QR พร้อมเพย์ / ข้อมูลโอน สำหรับผู้เรียนซื้อคอร์ส */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const amountBaht =
      typeof body.amountBaht === "number" && Number.isFinite(body.amountBaht)
        ? Math.max(0, Math.round(body.amountBaht))
        : 0;
    if (amountBaht <= 0 || amountBaht > 9_999_999) {
      return NextResponse.json({ error: "ยอดไม่ถูกต้อง" }, { status: 400 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const phone = profile.promptPayPhone?.trim() ?? "";
    const digits = phone.replace(/\D/g, "");
    const staticQr = profile.promptPayQrImageUrl?.trim() || null;
    const bankPayload = {
      promptPayPhone: phone || null,
      bankName: profile.bankName ?? null,
      bankAccountNumber: profile.bankAccountNumber ?? null,
      bankAccountName: profile.bankAccountName ?? null,
      shopName: profile.displayName ?? null,
    };

    if (staticQr) {
      return NextResponse.json({
        qrDataUrl: staticQr,
        configured: true,
        ...bankPayload,
      });
    }

    if (digits.length < 9) {
      return NextResponse.json({
        qrDataUrl: null as string | null,
        configured: false,
        ...bankPayload,
      });
    }

    const qrDataUrl = await buildPromptPayQrDataUrl(digits, amountBaht);
    return NextResponse.json({
      qrDataUrl,
      configured: Boolean(qrDataUrl),
      ...bankPayload,
    });
  } catch (e) {
    console.error("[lms/public/[slug]/promptpay-qr POST]", e);
    return NextResponse.json({ error: "โหลด QR ไม่สำเร็จ" }, { status: 500 });
  }
}

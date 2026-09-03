import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ slug: string; linkId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug, linkId } = await ctx.params;
    const url = new URL(req.url);
    const profile = await findClubEventPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const link = await prisma.clubEventDynamicLink.findFirst({
      where: { id: linkId, profileId: profile.id, isActive: true },
    });
    if (!link) {
      return NextResponse.json({ error: "ไม่พบลิงก์" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });

    const respondentName = typeof body.respondentName === "string" ? body.respondentName.trim().slice(0, 160) : "";
    const respondentPhone =
      typeof body.respondentPhone === "string" ? body.respondentPhone.trim().slice(0, 32) : "";
    if (!respondentName) {
      return NextResponse.json({ error: "กรอกชื่อ" }, { status: 400 });
    }

    const config = parseDynamicLinkConfig(link.configJson);
    const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 2000) : "";
    const paymentMethod =
      typeof body.paymentMethod === "string" ? body.paymentMethod.trim().slice(0, 32) : null;
    const slipUrl = typeof body.slipUrl === "string" ? body.slipUrl.trim().slice(0, 512) : null;

    let amountBaht: number | null = null;
    if (link.type === "PAYMENT") {
      amountBaht = Number(config.amountBaht) || 0;
      if (amountBaht > 0 && (paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && !slipUrl) {
        return NextResponse.json({ error: "แนบสลิปหลังชำระ" }, { status: 400 });
      }
    }

    const payload = {
      answer,
      eventId: config.eventId ?? null,
      fields: config.fields ?? [],
    };

    const row = await prisma.clubEventLinkSubmission.create({
      data: {
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        linkId: link.id,
        respondentName,
        respondentPhone,
        payloadJson: JSON.stringify(payload),
        amountBaht,
        paymentMethod,
        slipUrl,
      },
    });

    if (link.type === "PAYMENT" && amountBaht != null && amountBaht > 0) {
      await prisma.clubEventFinanceTransaction.create({
        data: {
          ownerUserId: profile.ownerUserId,
          trialSessionId: profile.trialSessionId,
          profileId: profile.id,
          type: "INCOME",
          category: "ค่ากิจกรรม (ลิงก์)",
          amountBaht: Math.round(amountBaht),
          transactedAt: new Date(),
          note: `${link.title} · ${respondentName}`,
          slipUrl,
        },
      });
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[club-event/public links submit POST]", e);
    return NextResponse.json({ error: "ส่งไม่สำเร็จ" }, { status: 500 });
  }
}

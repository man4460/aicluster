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
    const fields = config.fields ?? [];
    const answersRaw =
      body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? (body.answers as Record<string, unknown>)
        : null;
    const answers: Record<string, string> = {};
    for (const f of fields) {
      const fromMap = answersRaw && typeof answersRaw[f.key] === "string" ? String(answersRaw[f.key]) : "";
      answers[f.key] = fromMap.trim().slice(0, 2000);
      if (f.required && !answers[f.key]) {
        return NextResponse.json({ error: `กรอก/เลือก: ${f.label}` }, { status: 400 });
      }
      if (f.type === "choice" && answers[f.key] && f.options && !f.options.includes(answers[f.key])) {
        return NextResponse.json({ error: `ตัวเลือกไม่ถูกต้อง: ${f.label}` }, { status: 400 });
      }
    }
    const legacyAnswer =
      typeof body.answer === "string" ? body.answer.trim().slice(0, 2000) : "";
    if (fields.length === 0 && legacyAnswer) {
      answers.answer = legacyAnswer;
    }

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
      answers,
      answer: answers[fields[0]?.key ?? "answer"] ?? legacyAnswer,
      eventId: config.eventId ?? null,
      fields,
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { normalizeClubPersonName, normalizeClubPhoneDigits } from "@/systems/club-event/lib/dues";
import { resolveClubLinkBundledAnnualDues } from "@/systems/club-event/lib/link-bundled-dues";
import {
  computeClubLinkAnswersAmountBaht,
  parseClubLinkQtyAnswer,
  serializeClubLinkQtyAnswer,
} from "@/systems/club-event/lib/link-field-amount";
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
    const nameKey = normalizeClubPersonName(respondentName);
    const phoneDigits = normalizeClubPhoneDigits(respondentPhone);
    if (!nameKey) {
      return NextResponse.json({ error: "กรอกชื่อ" }, { status: 400 });
    }
    if (phoneDigits.length < 9) {
      return NextResponse.json({ error: "กรอกเบอร์โทรให้ครบ" }, { status: 400 });
    }

    const prior = await prisma.clubEventLinkSubmission.findMany({
      where: { linkId: link.id },
      select: { respondentName: true, respondentPhone: true },
      orderBy: { createdAt: "desc" },
      take: 3000,
    });
    const alreadySubmitted = prior.some(
      (row) =>
        normalizeClubPhoneDigits(row.respondentPhone) === phoneDigits &&
        normalizeClubPersonName(row.respondentName) === nameKey,
    );
    if (alreadySubmitted) {
      return NextResponse.json(
        { error: "ชื่อและเบอร์โทรนี้เคยส่งคำตอบลิงก์นี้แล้ว ไม่สามารถส่งซ้ำได้" },
        { status: 409 },
      );
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
      if (f.type === "qty") {
        const map = parseClubLinkQtyAnswer(answers[f.key]);
        const allowed = new Set((f.qtyItems ?? []).map((item) => item.key));
        const clean: Record<string, number> = {};
        for (const [k, n] of Object.entries(map)) {
          if (allowed.has(k) && n > 0) clean[k] = n;
        }
        answers[f.key] = serializeClubLinkQtyAnswer(clean);
        if (f.required && Object.keys(clean).length === 0) {
          return NextResponse.json({ error: `กรอกจำนวน: ${f.label}` }, { status: 400 });
        }
        continue;
      }
      if (f.required && !answers[f.key]) {
        return NextResponse.json({ error: `กรอก/เลือก: ${f.label}` }, { status: 400 });
      }
      const choiceLabels = (f.choiceOptions ?? []).map((o) => o.label);
      const allowed = choiceLabels.length > 0 ? choiceLabels : f.options;
      if (f.type === "choice" && answers[f.key] && allowed && !allowed.includes(answers[f.key])) {
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

    const includeBundledDues = body.includeBundledDues !== false;
    const bundledDues = includeBundledDues
      ? resolveClubLinkBundledAnnualDues({
          linkAnnualDues: config.linkAnnualDues,
          profile: {
            duesEnabled: profile.duesEnabled,
            duesAmountBaht: profile.duesAmountBaht,
            duesPeriod: profile.duesPeriod,
          },
        })
      : null;
    const includeDuesBaht = bundledDues?.amountBaht ?? 0;

    let amountBaht: number | null = null;
    if (link.type === "PAYMENT") {
      amountBaht = computeClubLinkAnswersAmountBaht(fields, answers, {
        baseAmountBaht: Number(config.amountBaht) || 0,
        includeDuesBaht,
      });
      if (amountBaht > 0 && (paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && !slipUrl) {
        return NextResponse.json({ error: "แนบสลิปหลังชำระ" }, { status: 400 });
      }
    }

    const payload = {
      answers,
      answer: answers[fields[0]?.key ?? "answer"] ?? legacyAnswer,
      eventId: config.eventId ?? null,
      fields,
      includeBundledDues: Boolean(bundledDues),
      bundledDuesAmountBaht: includeDuesBaht || undefined,
      bundledDuesPeriodKey: bundledDues?.periodKey,
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
          category: includeDuesBaht > 0 ? "ค่ากิจกรรม+ค่าบำรุง (ลิงก์)" : "ค่ากิจกรรม (ลิงก์)",
          amountBaht: Math.round(amountBaht),
          transactedAt: new Date(),
          note: `${link.title} · ${respondentName}`,
          slipUrl,
        },
      });
    }

    if (link.type === "PAYMENT" && bundledDues && includeDuesBaht > 0) {
      const phoneDigits = normalizeClubPhoneDigits(respondentPhone);
      const members =
        phoneDigits.length >= 9
          ? await prisma.clubEventMember.findMany({
              where: {
                profileId: profile.id,
                isActive: true,
                ownerUserId: profile.ownerUserId,
                trialSessionId: profile.trialSessionId,
              },
              select: { id: true, memberCode: true, phone: true },
              take: 2000,
            })
          : [];
      const matched =
        phoneDigits.length >= 9
          ? members.find((m) => normalizeClubPhoneDigits(m.phone) === phoneDigits)
          : undefined;

      await prisma.clubEventDuesPayment.create({
        data: {
          ownerUserId: profile.ownerUserId,
          trialSessionId: profile.trialSessionId,
          profileId: profile.id,
          memberId: matched?.id ?? null,
          payerName: respondentName,
          payerPhone: respondentPhone,
          memberCode: matched?.memberCode ?? "",
          amountBaht: includeDuesBaht,
          periodKey: bundledDues.periodKey,
          periodLabel: bundledDues.periodLabel,
          paymentMethod,
          slipUrl,
          source: "EVENT_BUNDLE",
          sourceLinkId: link.id,
          sourceSubmissionId: row.id,
          sourceEventId: config.eventId ?? null,
          note: `พ่วงจากลิงก์ · ${link.title}`,
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[club-event/public links submit POST]", e);
    return NextResponse.json({ error: "ส่งไม่สำเร็จ" }, { status: 500 });
  }
}

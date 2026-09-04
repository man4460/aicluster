import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";
import {
  clubDeskMatchScore,
  clubDeskPersonKey,
  fieldsFromLinkConfigJson,
  fulfillmentFromAnswers,
  mapClubEventCheckInRow,
  parseSubmissionAnswers,
  serializeFulfillmentJson,
} from "@/systems/club-event/lib/desk";
import { notifyClubEventDesk } from "@/systems/club-event/lib/desk-sse";

type Ctx = { params: Promise<{ id: string }> };

async function loadEventForOwner(eventId: string, ownerId: string, trialSessionId: string) {
  return prisma.clubEventRecord.findFirst({
    where: { id: eventId, ...clubEventOwnerWhere(ownerId, trialSessionId) },
    select: {
      id: true,
      title: true,
      eventDate: true,
      profileId: true,
      profile: { select: { id: true, slug: true, displayName: true } },
    },
  });
}

/** สรุป + ค้นหาผู้มาลงทะเบียน / สมาชิก / คำตอบล่วงหน้า */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: eventId } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const event = await loadEventForOwner(eventId, own.ownerId, scope.trialSessionId);
    if (!event) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();

    const links = await prisma.clubEventDynamicLink.findMany({
      where: {
        profileId: event.profileId,
        isActive: true,
        ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
      },
      select: { id: true, title: true, type: true, configJson: true },
    });
    const eventLinks = links.filter((l) => parseDynamicLinkConfig(l.configJson).eventId === eventId);

    const [checkIns, members, submissions] = await Promise.all([
      prisma.clubEventCheckIn.findMany({
        where: { eventId, profileId: event.profileId },
        orderBy: { checkedInAt: "desc" },
        take: 500,
      }),
      prisma.clubEventMember.findMany({
        where: { profileId: event.profileId, isActive: true },
        orderBy: { name: "asc" },
        take: 500,
        select: {
          id: true,
          name: true,
          phone: true,
          memberCode: true,
        },
      }),
      eventLinks.length
        ? prisma.clubEventLinkSubmission.findMany({
            where: { linkId: { in: eventLinks.map((l) => l.id) } },
            orderBy: { createdAt: "desc" },
            take: 800,
          })
        : Promise.resolve([]),
    ]);

    const linkById = new Map(eventLinks.map((l) => [l.id, l]));
    const checkInDtos = checkIns.map(mapClubEventCheckInRow);
    const checkedMemberIds = new Set(checkInDtos.map((c) => c.memberId).filter(Boolean));
    const checkedCodes = new Set(
      checkInDtos.map((c) => c.memberCode.trim().toLowerCase()).filter(Boolean),
    );
    const checkedPhones = new Set(
      checkInDtos.map((c) => c.guestPhone.replace(/\D/g, "")).filter((p) => p.length >= 9),
    );
    const checkedSubmissionIds = new Set(checkInDtos.map((c) => c.submissionId).filter(Boolean));

    const registered = submissions.map((s) => {
      const link = linkById.get(s.linkId);
      const fields = link ? fieldsFromLinkConfigJson(link.configJson) : [];
      const answers = parseSubmissionAnswers(s.payloadJson);
      const payload = (() => {
        try {
          return JSON.parse(s.payloadJson) as Record<string, unknown>;
        } catch {
          return {};
        }
      })();
      const memberCode = typeof payload.memberCode === "string" ? payload.memberCode.trim() : "";
      const fulfillment = fulfillmentFromAnswers(fields, answers);
      const alreadyIn =
        checkedSubmissionIds.has(s.id) ||
        (memberCode && checkedCodes.has(memberCode.toLowerCase())) ||
        (s.respondentPhone.replace(/\D/g, "").length >= 9 &&
          checkedPhones.has(s.respondentPhone.replace(/\D/g, "")));
      return {
        kind: "submission" as const,
        submissionId: s.id,
        linkId: s.linkId,
        linkTitle: link?.title ?? "",
        name: s.respondentName,
        phone: s.respondentPhone,
        memberCode,
        amountBaht: s.amountBaht,
        paymentMethod: s.paymentMethod,
        fulfillment,
        alreadyCheckedIn: Boolean(alreadyIn),
        createdAt: s.createdAt.toISOString(),
      };
    });

    const memberRows = members.map((m) => ({
      kind: "member" as const,
      memberId: m.id,
      name: m.name,
      phone: m.phone,
      memberCode: m.memberCode,
      alreadyCheckedIn:
        checkedMemberIds.has(m.id) ||
        (m.memberCode.trim() && checkedCodes.has(m.memberCode.trim().toLowerCase())),
    }));

    const filteredRegistered = q
      ? registered.filter((r) =>
          clubDeskMatchScore({
            name: r.name,
            phone: r.phone,
            memberCode: r.memberCode,
            query: q,
          }),
        )
      : registered;
    const registeredKeys = new Set(
      filteredRegistered
        .map((r) => clubDeskPersonKey({ memberCode: r.memberCode, phone: r.phone, name: r.name }))
        .filter(Boolean),
    );
    const filteredMembers = (q
      ? memberRows.filter((m) =>
          clubDeskMatchScore({
            name: m.name,
            phone: m.phone,
            memberCode: m.memberCode,
            query: q,
          }),
        )
      : memberRows
    ).filter((m) => {
      const key = clubDeskPersonKey({
        memberCode: m.memberCode,
        phone: m.phone,
        name: m.name,
      });
      return !key || !registeredKeys.has(key);
    });
    const filteredCheckIns = q
      ? checkInDtos.filter((c) =>
          clubDeskMatchScore({
            name: c.guestName,
            phone: c.guestPhone,
            memberCode: c.memberCode,
            query: q,
          }),
        )
      : checkInDtos;

    const pendingFulfill = checkInDtos.filter((c) =>
      c.fulfillment.some((f) => !f.delivered),
    ).length;
    const pendingPay = checkInDtos.filter(
      (c) => c.paymentDueBaht > 0 && !c.paymentCleared,
    ).length;
    const pendingSign = checkInDtos.filter(
      (c) => c.fulfillment.some((f) => f.delivered) && !c.signatureImageUrl,
    ).length;

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate.toISOString(),
        slug: event.profile.slug,
        clubName: event.profile.displayName,
      },
      summary: {
        checkedIn: checkInDtos.length,
        registered: registered.length,
        pendingFulfill,
        pendingPay,
        pendingSign,
      },
      checkIns: filteredCheckIns,
      registered: filteredRegistered.slice(0, 80),
      members: filteredMembers.slice(0, 80),
    });
  } catch (e) {
    console.error("[club-event/desk GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

/** เช็กอิน — จากคำตอบล่วงหน้า / สมาชิก / walk-in */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: eventId } = await ctx.params;
    const { scope, profile } = await clubEventSessionContext(own.ownerId);
    const event = await loadEventForOwner(eventId, own.ownerId, scope.trialSessionId);
    if (!event) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    const body = (await req.json()) as {
      source?: string;
      submissionId?: string;
      memberId?: string;
      guestName?: string;
      guestPhone?: string;
      memberCode?: string;
      note?: string;
    };

    const source =
      body.source === "QR" || body.source === "WALK_IN" || body.source === "STAFF"
        ? body.source
        : "STAFF";

    let guestName = (body.guestName ?? "").trim().slice(0, 160);
    let guestPhone = (body.guestPhone ?? "").trim().slice(0, 32);
    let memberCode = (body.memberCode ?? "").trim().slice(0, 64);
    let memberId: string | null = body.memberId?.trim() || null;
    let submissionId: string | null = body.submissionId?.trim() || null;
    let fulfillment = serializeFulfillmentJson([]);
    let paymentDueBaht = 0;
    let paymentCleared = true;

    if (submissionId) {
      const sub = await prisma.clubEventLinkSubmission.findFirst({
        where: { id: submissionId, ownerUserId: own.ownerId },
        include: { link: { select: { id: true, configJson: true, profileId: true } } },
      });
      if (!sub || sub.link.profileId !== event.profileId) {
        return NextResponse.json({ error: "ไม่พบคำตอบที่ผูกกิจกรรม" }, { status: 404 });
      }
      const cfg = parseDynamicLinkConfig(sub.link.configJson);
      if (cfg.eventId && cfg.eventId !== eventId) {
        return NextResponse.json({ error: "คำตอบนี้ไม่ใช่ของกิจกรรมนี้" }, { status: 400 });
      }
      const existing = await prisma.clubEventCheckIn.findFirst({
        where: { eventId, submissionId },
      });
      if (existing) {
        notifyClubEventDesk(eventId);
        return NextResponse.json({
          checkIn: mapClubEventCheckInRow(existing),
          already: true,
        });
      }
      guestName = sub.respondentName || guestName || "ไม่ระบุชื่อ";
      guestPhone = sub.respondentPhone || guestPhone;
      try {
        const payload = JSON.parse(sub.payloadJson) as Record<string, unknown>;
        if (typeof payload.memberCode === "string") memberCode = payload.memberCode.trim() || memberCode;
      } catch {
        /* ignore */
      }
      const fields = fieldsFromLinkConfigJson(sub.link.configJson);
      const answers = parseSubmissionAnswers(sub.payloadJson);
      fulfillment = serializeFulfillmentJson(fulfillmentFromAnswers(fields, answers));
      paymentDueBaht = typeof sub.amountBaht === "number" && sub.amountBaht > 0 ? 0 : 0;
      /** ถ้ายอดใน submission มีและมีสลิป/วิธีชำระ ถือว่าเคลียร์แล้ว — ไม่มียอดค้างเริ่มต้นจากยอดที่จ่ายแล้ว */
      paymentCleared = true;
      paymentDueBaht = 0;
    } else if (memberId) {
      const member = await prisma.clubEventMember.findFirst({
        where: { id: memberId, profileId: event.profileId, isActive: true },
      });
      if (!member) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
      const existing = await prisma.clubEventCheckIn.findFirst({
        where: { eventId, memberId: member.id },
      });
      if (existing) {
        notifyClubEventDesk(eventId);
        return NextResponse.json({
          checkIn: mapClubEventCheckInRow(existing),
          already: true,
        });
      }
      guestName = member.name;
      guestPhone = member.phone;
      memberCode = member.memberCode;
      memberId = member.id;
    } else {
      if (!guestName) {
        return NextResponse.json({ error: "กรอกชื่อผู้มาลงทะเบียน" }, { status: 400 });
      }
    }

    if (memberCode) {
      const byCode = await prisma.clubEventCheckIn.findFirst({
        where: { eventId, memberCode },
      });
      if (byCode) {
        notifyClubEventDesk(eventId);
        return NextResponse.json({
          checkIn: mapClubEventCheckInRow(byCode),
          already: true,
        });
      }
    }

    const created = await prisma.clubEventCheckIn.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        eventId,
        memberId,
        guestName: guestName || "ไม่ระบุชื่อ",
        guestPhone,
        memberCode,
        source: submissionId ? source : memberId ? source : "WALK_IN",
        submissionId,
        fulfillmentJson: fulfillment,
        paymentDueBaht,
        paymentCleared,
        note: (body.note ?? "").trim().slice(0, 500),
      },
    });

    notifyClubEventDesk(eventId);
    return NextResponse.json({ checkIn: mapClubEventCheckInRow(created), already: false });
  } catch (e) {
    console.error("[club-event/desk POST]", e);
    return NextResponse.json({ error: "เช็กอินไม่สำเร็จ" }, { status: 500 });
  }
}

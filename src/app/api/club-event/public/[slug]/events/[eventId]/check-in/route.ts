import { NextResponse } from "next/server";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
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
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

type Ctx = { params: Promise<{ slug: string; eventId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, eventId } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const q = (url.searchParams.get("q") ?? "").trim();

    const profile = await findClubEventPublicProfile(slug, trialParam);
    if (!profile) return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });

    const event = await prisma.clubEventRecord.findFirst({
      where: { id: eventId, profileId: profile.id },
      select: { id: true, title: true, eventDate: true, description: true },
    });
    if (!event) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    const links = await prisma.clubEventDynamicLink.findMany({
      where: { profileId: profile.id, isActive: true },
      select: { id: true, title: true, configJson: true },
    });
    const eventLinkIds = links
      .filter((l) => parseDynamicLinkConfig(l.configJson).eventId === eventId)
      .map((l) => l.id);

    let hits: Array<{
      kind: "submission" | "member";
      submissionId?: string;
      memberId?: string;
      name: string;
      phone: string;
      memberCode: string;
      alreadyCheckedIn: boolean;
      fulfillmentCount: number;
    }> = [];

    if (q.length >= 2) {
      const [subs, members, checkIns] = await Promise.all([
        eventLinkIds.length
          ? prisma.clubEventLinkSubmission.findMany({
              where: { linkId: { in: eventLinkIds } },
              orderBy: { createdAt: "desc" },
              take: 300,
            })
          : Promise.resolve([]),
        prisma.clubEventMember.findMany({
          where: { profileId: profile.id, isActive: true },
          take: 300,
          select: { id: true, name: true, phone: true, memberCode: true },
        }),
        prisma.clubEventCheckIn.findMany({
          where: { eventId, profileId: profile.id },
          select: {
            submissionId: true,
            memberId: true,
            memberCode: true,
            guestPhone: true,
          },
        }),
      ]);

      const checkedSubs = new Set(checkIns.map((c) => c.submissionId).filter(Boolean));
      const checkedMembers = new Set(checkIns.map((c) => c.memberId).filter(Boolean));
      const checkedCodes = new Set(
        checkIns.map((c) => c.memberCode.trim().toLowerCase()).filter(Boolean),
      );

      const linkMap = new Map(links.map((l) => [l.id, l]));
      const seenPeople = new Set<string>();

      for (const s of subs) {
        let memberCode = "";
        try {
          const p = JSON.parse(s.payloadJson) as Record<string, unknown>;
          if (typeof p.memberCode === "string") memberCode = p.memberCode.trim();
        } catch {
          /* ignore */
        }
        if (
          !clubDeskMatchScore({
            name: s.respondentName,
            phone: s.respondentPhone,
            memberCode,
            query: q,
          })
        ) {
          continue;
        }
        const personKey = clubDeskPersonKey({
          memberCode,
          phone: s.respondentPhone,
          name: s.respondentName,
        });
        if (personKey && seenPeople.has(personKey)) continue;
        if (personKey) seenPeople.add(personKey);

        const link = linkMap.get(s.linkId);
        const fulfillment = link
          ? fulfillmentFromAnswers(
              fieldsFromLinkConfigJson(link.configJson),
              parseSubmissionAnswers(s.payloadJson),
            )
          : [];
        hits.push({
          kind: "submission",
          submissionId: s.id,
          name: s.respondentName || "ไม่ระบุชื่อ",
          phone: s.respondentPhone,
          memberCode,
          alreadyCheckedIn:
            checkedSubs.has(s.id) ||
            (memberCode ? checkedCodes.has(memberCode.toLowerCase()) : false),
          fulfillmentCount: fulfillment.reduce((n, f) => n + f.qty, 0),
        });
      }

      for (const m of members) {
        if (
          !clubDeskMatchScore({
            name: m.name,
            phone: m.phone,
            memberCode: m.memberCode,
            query: q,
          })
        ) {
          continue;
        }
        const personKey = clubDeskPersonKey({
          memberCode: m.memberCode,
          phone: m.phone,
          name: m.name,
        });
        // มีคำตอบลงทะเบียนล่วงหน้าแล้ว — ไม่โชว์ซ้ำจากรายชื่อสมาชิก
        if (personKey && seenPeople.has(personKey)) continue;
        if (personKey) seenPeople.add(personKey);

        hits.push({
          kind: "member",
          memberId: m.id,
          name: m.name,
          phone: m.phone,
          memberCode: m.memberCode,
          alreadyCheckedIn:
            checkedMembers.has(m.id) ||
            (m.memberCode ? checkedCodes.has(m.memberCode.toLowerCase()) : false),
          fulfillmentCount: 0,
        });
      }
      hits = hits.slice(0, 20);
    }

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate.toISOString(),
        description: event.description,
      },
      clubName: profile.displayName,
      logoUrl: profile.logoUrl,
      hits,
    });
  } catch (e) {
    console.error("[club-event/public check-in GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug, eventId } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const profile = await findClubEventPublicProfile(slug, trialParam);
    if (!profile) return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });

    const event = await prisma.clubEventRecord.findFirst({
      where: { id: eventId, profileId: profile.id },
      select: { id: true, profileId: true },
    });
    if (!event) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    const body = (await req.json()) as {
      submissionId?: string;
      memberId?: string;
      guestName?: string;
      guestPhone?: string;
      memberCode?: string;
      walkIn?: boolean;
    };

    let guestName = (body.guestName ?? "").trim().slice(0, 160);
    let guestPhone = (body.guestPhone ?? "").trim().slice(0, 32);
    let memberCode = (body.memberCode ?? "").trim().slice(0, 64);
    let memberId: string | null = body.memberId?.trim() || null;
    let submissionId: string | null = body.submissionId?.trim() || null;
    let fulfillmentJson = "[]";
    const source = body.walkIn ? "WALK_IN" : "QR";

    if (submissionId) {
      const sub = await prisma.clubEventLinkSubmission.findFirst({
        where: { id: submissionId },
        include: { link: true },
      });
      if (!sub || sub.link.profileId !== profile.id) {
        return NextResponse.json({ error: "ไม่พบการลงทะเบียน" }, { status: 404 });
      }
      const cfg = parseDynamicLinkConfig(sub.link.configJson);
      if (cfg.eventId && cfg.eventId !== eventId) {
        return NextResponse.json({ error: "ไม่ใช่กิจกรรมนี้" }, { status: 400 });
      }
      const existing = await prisma.clubEventCheckIn.findFirst({
        where: { eventId, submissionId },
      });
      if (existing) {
        return NextResponse.json({ checkIn: mapClubEventCheckInRow(existing), already: true });
      }
      guestName = sub.respondentName || guestName || "ไม่ระบุชื่อ";
      guestPhone = sub.respondentPhone || guestPhone;
      try {
        const p = JSON.parse(sub.payloadJson) as Record<string, unknown>;
        if (typeof p.memberCode === "string") memberCode = p.memberCode.trim() || memberCode;
      } catch {
        /* ignore */
      }
      fulfillmentJson = serializeFulfillmentJson(
        fulfillmentFromAnswers(
          fieldsFromLinkConfigJson(sub.link.configJson),
          parseSubmissionAnswers(sub.payloadJson),
        ),
      );
    } else if (memberId) {
      const member = await prisma.clubEventMember.findFirst({
        where: { id: memberId, profileId: profile.id, isActive: true },
      });
      if (!member) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
      const existing = await prisma.clubEventCheckIn.findFirst({
        where: { eventId, memberId: member.id },
      });
      if (existing) {
        return NextResponse.json({ checkIn: mapClubEventCheckInRow(existing), already: true });
      }
      guestName = member.name;
      guestPhone = member.phone;
      memberCode = member.memberCode;
      memberId = member.id;
    } else if (body.walkIn) {
      if (!guestName) {
        return NextResponse.json({ error: "กรอกชื่อ" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "เลือกชื่อจากรายการ หรือลงทะเบียนหน้างาน" }, { status: 400 });
    }

    if (memberCode) {
      const byCode = await prisma.clubEventCheckIn.findFirst({
        where: { eventId, memberCode },
      });
      if (byCode) {
        return NextResponse.json({ checkIn: mapClubEventCheckInRow(byCode), already: true });
      }
    }

    const created = await prisma.clubEventCheckIn.create({
      data: {
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        profileId: profile.id,
        eventId,
        memberId,
        guestName: guestName || "ไม่ระบุชื่อ",
        guestPhone,
        memberCode,
        source,
        submissionId,
        fulfillmentJson,
        paymentDueBaht: 0,
        paymentCleared: true,
      },
    });

    return NextResponse.json({ checkIn: mapClubEventCheckInRow(created), already: false });
  } catch (e) {
    console.error("[club-event/public check-in POST]", e);
    return NextResponse.json({ error: "เช็กอินไม่สำเร็จ" }, { status: 500 });
  }
}

/** อัปโหลดลายเซ็นจากหน้าสาธารณะ (ผูก owner จากโปรไฟล์) */
export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { slug, eventId } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const profile = await findClubEventPublicProfile(slug, trialParam);
    if (!profile) return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });

    const form = await req.formData();
    const checkInId = String(form.get("checkInId") ?? "").trim();
    const file = form.get("file");
    if (!checkInId || !(file instanceof File)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    const row = await prisma.clubEventCheckIn.findFirst({
      where: { id: checkInId, eventId, profileId: profile.id },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบเช็กอิน" }, { status: 404 });

    const saved = await saveOwnerModuleUploadImage(
      file,
      "club-event",
      "signatures",
      profile.ownerUserId,
    );
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    const updated = await prisma.clubEventCheckIn.update({
      where: { id: row.id },
      data: {
        signatureImageUrl: saved.imageUrl,
        signedAt: new Date(),
      },
    });

    return NextResponse.json({ checkIn: mapClubEventCheckInRow(updated) });
  } catch (e) {
    console.error("[club-event/public check-in PUT]", e);
    return NextResponse.json({ error: "บันทึกลายเซ็นไม่สำเร็จ" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import {
  clubEventDuesDateInPeriod,
  clubEventDuesPeriodForDate,
  normalizeClubPersonName,
  normalizeClubPhoneDigits,
  type ClubEventDuesPeriodKey,
} from "@/systems/club-event/lib/dues";

function parsePeriod(raw: string | null | undefined): ClubEventDuesPeriodKey {
  if (raw === "MONTHLY" || raw === "QUARTERLY" || raw === "SEMIANNUAL" || raw === "YEARLY") {
    return raw;
  }
  return "YEARLY";
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const period = parsePeriod(profile.duesPeriod);
    const { periodKey, periodLabel } = clubEventDuesPeriodForDate(period);

    if (!profile.duesEnabled || !profile.duesLinkId) {
      return NextResponse.json({
        enabled: false,
        periodKey,
        periodLabel,
        amountBaht: Math.max(0, Math.round(Number(profile.duesAmountBaht) || 0)),
        linkId: null,
        paid: [],
        unpaidMembers: [],
        summary: { paidCount: 0, unpaidCount: 0, paidAmountBaht: 0, memberCount: 0 },
      });
    }

    const ownerWhere = clubEventOwnerWhere(own.ownerId, scope.trialSessionId);

    const [submissions, duesPayments, members] = await Promise.all([
      prisma.clubEventLinkSubmission.findMany({
        where: { linkId: profile.duesLinkId, ...ownerWhere },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.clubEventDuesPayment.findMany({
        where: { profileId: profile.id, periodKey, ...ownerWhere },
        orderBy: { paidAt: "desc" },
        take: 500,
      }),
      prisma.clubEventMember.findMany({
        where: { profileId: profile.id, isActive: true, ...ownerWhere },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          nickname: true,
          phone: true,
          memberCode: true,
          photoUrl: true,
          position: true,
        },
      }),
    ]);

    const paidInPeriod = submissions.filter((s) =>
      clubEventDuesDateInPeriod(period, periodKey, s.createdAt),
    );

    const paidPhones = new Set<string>();
    const paidNames = new Set<string>();
    for (const s of paidInPeriod) {
      const phone = normalizeClubPhoneDigits(s.respondentPhone);
      if (phone.length >= 9) paidPhones.add(phone);
      const name = normalizeClubPersonName(s.respondentName);
      if (name) paidNames.add(name);
    }
    for (const p of duesPayments) {
      const phone = normalizeClubPhoneDigits(p.payerPhone);
      if (phone.length >= 9) paidPhones.add(phone);
      const name = normalizeClubPersonName(p.payerName);
      if (name) paidNames.add(name);
    }

    type PaidRow = {
      id: string;
      respondentName: string;
      respondentPhone: string;
      amountBaht: number | null;
      paymentMethod: string | null;
      slipUrl: string | null;
      slipVerifiedAt: string | null;
      slipVerified: boolean;
      createdAt: string;
      matchedMemberId: string | null;
      matchedMemberName: string | null;
      source?: string;
    };

    const paidFromSubmissions: PaidRow[] = paidInPeriod.map((s) => {
      const phone = normalizeClubPhoneDigits(s.respondentPhone);
      const name = normalizeClubPersonName(s.respondentName);
      const byPhone =
        phone.length >= 9 ? members.find((m) => normalizeClubPhoneDigits(m.phone) === phone) : undefined;
      const byName =
        !byPhone && name
          ? members.find((m) => {
              const mPhone = normalizeClubPhoneDigits(m.phone);
              if (mPhone.length >= 9) return false;
              return normalizeClubPersonName(m.name) === name;
            })
          : undefined;
      const matched = byPhone ?? byName;
      return {
        id: s.id,
        respondentName: s.respondentName,
        respondentPhone: s.respondentPhone,
        amountBaht: s.amountBaht,
        paymentMethod: s.paymentMethod,
        slipUrl: s.slipUrl,
        slipVerifiedAt: s.slipVerifiedAt?.toISOString() ?? null,
        slipVerified: Boolean(s.slipVerifiedAt),
        createdAt: s.createdAt.toISOString(),
        matchedMemberId: matched?.id ?? null,
        matchedMemberName: matched?.name ?? null,
        source: "DIRECT",
      };
    });

    const paidFromBundle: PaidRow[] = duesPayments.map((p) => {
      const phone = normalizeClubPhoneDigits(p.payerPhone);
      const name = normalizeClubPersonName(p.payerName);
      const byPhone =
        phone.length >= 9 ? members.find((m) => normalizeClubPhoneDigits(m.phone) === phone) : undefined;
      const byName =
        !byPhone && name
          ? members.find((m) => {
              const mPhone = normalizeClubPhoneDigits(m.phone);
              if (mPhone.length >= 9) return false;
              return normalizeClubPersonName(m.name) === name;
            })
          : undefined;
      const matched = byPhone ?? byName ?? (p.memberId ? members.find((m) => m.id === p.memberId) : undefined);
      return {
        id: p.id,
        respondentName: p.payerName,
        respondentPhone: p.payerPhone,
        amountBaht: p.amountBaht,
        paymentMethod: p.paymentMethod,
        slipUrl: p.slipUrl,
        slipVerifiedAt: null,
        slipVerified: false,
        createdAt: p.paidAt.toISOString(),
        matchedMemberId: matched?.id ?? p.memberId ?? null,
        matchedMemberName: matched?.name ?? null,
        source: p.source,
      };
    });

    const seenIds = new Set(paidFromSubmissions.map((r) => r.id));
    const paid: PaidRow[] = [
      ...paidFromSubmissions,
      ...paidFromBundle.filter((r) => !seenIds.has(r.id)),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const unpaidMembers = members
      .filter((m) => {
        const phone = normalizeClubPhoneDigits(m.phone);
        if (phone.length >= 9 && paidPhones.has(phone)) return false;
        const name = normalizeClubPersonName(m.name);
        if (phone.length < 9 && name && paidNames.has(name)) return false;
        return true;
      })
      .map((m) => ({
        id: m.id,
        name: m.name,
        nickname: m.nickname,
        phone: m.phone,
        memberCode: m.memberCode,
        photoUrl: m.photoUrl,
        position: m.position,
      }));

    const paidAmountBaht = paid.reduce((sum, row) => sum + Math.max(0, Math.round(Number(row.amountBaht) || 0)), 0);

    return NextResponse.json({
      enabled: true,
      periodKey,
      periodLabel,
      amountBaht: Math.max(0, Math.round(Number(profile.duesAmountBaht) || 0)),
      linkId: profile.duesLinkId,
      paid,
      unpaidMembers,
      summary: {
        paidCount: paid.length,
        unpaidCount: unpaidMembers.length,
        paidAmountBaht,
        memberCount: members.length,
      },
    });
  } catch (e) {
    console.error("[club-event/session/dues/status GET]", e);
    return NextResponse.json({ error: "โหลดสถานะค่าบำรุงไม่สำเร็จ" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import {
  mapClubEventCheckInRow,
  parseFulfillmentJson,
  serializeFulfillmentJson,
  type ClubEventFulfillmentItem,
} from "@/systems/club-event/lib/desk";
import { notifyClubEventDesk } from "@/systems/club-event/lib/desk-sse";

type Ctx = { params: Promise<{ id: string; checkInId: string }> };

/** อัปเดตจ่ายของ · เคลียร์ชำระ · ลายเซ็น */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: eventId, checkInId } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);

    const row = await prisma.clubEventCheckIn.findFirst({
      where: {
        id: checkInId,
        eventId,
        ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
      },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรายการเช็กอิน" }, { status: 404 });

    const body = (await req.json()) as {
      deliverKey?: string;
      deliverAll?: boolean;
      undeliverKey?: string;
      paymentCleared?: boolean;
      paymentDueBaht?: number;
      signatureImageUrl?: string | null;
      note?: string;
    };

    let fulfillment = parseFulfillmentJson(row.fulfillmentJson);
    const nowIso = new Date().toISOString();

    if (body.deliverAll) {
      fulfillment = fulfillment.map((f) =>
        f.delivered ? f : { ...f, delivered: true, deliveredAt: nowIso },
      );
    }
    if (body.deliverKey) {
      fulfillment = fulfillment.map((f) =>
        f.key === body.deliverKey ? { ...f, delivered: true, deliveredAt: nowIso } : f,
      );
    }
    if (body.undeliverKey) {
      fulfillment = fulfillment.map((f) =>
        f.key === body.undeliverKey ? { ...f, delivered: false, deliveredAt: null } : f,
      );
    }

    if (Array.isArray((body as { fulfillment?: ClubEventFulfillmentItem[] }).fulfillment)) {
      fulfillment = (body as { fulfillment: ClubEventFulfillmentItem[] }).fulfillment;
    }

    const signatureImageUrl =
      body.signatureImageUrl === null
        ? null
        : typeof body.signatureImageUrl === "string"
          ? body.signatureImageUrl.trim().slice(0, 512) || null
          : row.signatureImageUrl;

    if (
      signatureImageUrl &&
      !/^\/uploads\/club-event\//.test(signatureImageUrl) &&
      !/^\/uploads\//.test(signatureImageUrl) &&
      !/^https:\/\//.test(signatureImageUrl)
    ) {
      return NextResponse.json({ error: "ลายเซ็นไม่ถูกต้อง" }, { status: 400 });
    }

    const needsSign =
      fulfillment.some((f) => f.delivered) && Boolean(signatureImageUrl);
    const signedAt =
      signatureImageUrl && signatureImageUrl !== row.signatureImageUrl
        ? new Date()
        : signatureImageUrl
          ? row.signedAt
          : null;

    if (fulfillment.some((f) => f.delivered) && body.signatureImageUrl === undefined && !row.signatureImageUrl) {
      /* allow deliver without sign yet */
    }

    const updated = await prisma.clubEventCheckIn.update({
      where: { id: row.id },
      data: {
        fulfillmentJson: serializeFulfillmentJson(fulfillment),
        paymentCleared:
          typeof body.paymentCleared === "boolean" ? body.paymentCleared : row.paymentCleared,
        paymentDueBaht:
          typeof body.paymentDueBaht === "number" && Number.isFinite(body.paymentDueBaht)
            ? Math.max(0, Math.round(body.paymentDueBaht))
            : row.paymentDueBaht,
        signatureImageUrl,
        signedAt: signatureImageUrl ? signedAt ?? (needsSign ? new Date() : row.signedAt) : null,
        note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : row.note,
      },
    });

    notifyClubEventDesk(eventId);
    return NextResponse.json({ checkIn: mapClubEventCheckInRow(updated) });
  } catch (e) {
    console.error("[club-event/desk PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

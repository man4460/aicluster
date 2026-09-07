import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

function mapSubmission(r: {
  id: string;
  respondentName: string;
  respondentPhone: string;
  amountBaht: number | null;
  paymentMethod: string | null;
  slipUrl: string | null;
  slipVerifiedAt: Date | null;
  createdAt: Date;
  payloadJson: string;
}) {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(r.payloadJson) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  return {
    id: r.id,
    respondentName: r.respondentName,
    respondentPhone: r.respondentPhone,
    amountBaht: r.amountBaht,
    paymentMethod: r.paymentMethod,
    slipUrl: r.slipUrl,
    slipVerifiedAt: r.slipVerifiedAt?.toISOString() ?? null,
    slipVerified: Boolean(r.slipVerifiedAt),
    createdAt: r.createdAt.toISOString(),
    payload,
  };
}

/** PATCH — ทำเครื่องหมายตรวจสลิปแล้ว / ยกเลิก */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const body = (await req.json()) as { slipVerified?: unknown };

    if (typeof body.slipVerified !== "boolean") {
      return NextResponse.json({ error: "ระบุ slipVerified เป็น boolean" }, { status: 400 });
    }

    const existing = await prisma.clubEventLinkSubmission.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบคำตอบ" }, { status: 404 });

    if (body.slipVerified && !existing.slipUrl?.trim()) {
      return NextResponse.json({ error: "ไม่มีสลิปแนบ — ตรวจไม่ได้" }, { status: 400 });
    }

    const updated = await prisma.clubEventLinkSubmission.update({
      where: { id: existing.id },
      data: { slipVerifiedAt: body.slipVerified ? new Date() : null },
    });

    return NextResponse.json({ submission: mapSubmission(updated) });
  } catch (e) {
    console.error("[club-event/session/submissions PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

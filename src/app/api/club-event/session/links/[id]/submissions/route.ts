import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const link = await prisma.clubEventDynamicLink.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!link) return NextResponse.json({ error: "ไม่พบลิงก์" }, { status: 404 });

    const rows = await prisma.clubEventLinkSubmission.findMany({
      where: { linkId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      submissions: rows.map((r) => {
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
          createdAt: r.createdAt.toISOString(),
          payload,
        };
      }),
    });
  } catch (e) {
    console.error("[club-event/session/links submissions GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

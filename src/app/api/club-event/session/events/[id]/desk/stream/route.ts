import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { createClubEventDeskSseResponse } from "@/systems/club-event/lib/desk-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** SSE — รีเฟรชจุดลงทะเบียนเมื่อมีเช็กอิน (รวม QR สาธารณะ) / จ่ายของ / เซ็น */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await clubEventOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const { id: eventId } = await ctx.params;
  const { scope } = await clubEventSessionContext(own.ownerId);
  const event = await prisma.clubEventRecord.findFirst({
    where: { id: eventId, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

  return createClubEventDeskSseResponse(event.id);
}

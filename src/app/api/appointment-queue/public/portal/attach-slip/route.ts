import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAppointmentQueuePortalOpenForOwner } from "@/lib/appointment-queue/portal-access";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  bookingId: z.number().int().positive(),
  slipUrl: z.string().min(8).max(512),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { ownerId, bookingId, slipUrl } = parsed.data;
  const rl = rateLimit(`aq-portal-slip:${ip}:${ownerId}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ส่งถี่เกินไป" }, { status: 429 });

  const portalOk = await isAppointmentQueuePortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่สามารถใช้งานได้" }, { status: 403 });

  const scope = await resolveDataScopeBySlug(ownerId, APPOINTMENT_QUEUE_MODULE_SLUG);
  const row = await prisma.appointmentQueueBooking.findFirst({
    where: {
      id: bookingId,
      ownerUserId: ownerId,
      trialSessionId: scope.trialSessionId,
      status: "PENDING_DEPOSIT",
    },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  await prisma.appointmentQueueBooking.update({
    where: { id: row.id },
    data: { depositSlipUrl: slipUrl },
  });

  return NextResponse.json({ ok: true });
}

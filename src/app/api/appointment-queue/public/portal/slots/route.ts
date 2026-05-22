import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadSlotAvailabilityForDate } from "@/lib/appointment-queue/booking-slot-availability";
import { isAppointmentQueuePortalOpenForOwner } from "@/lib/appointment-queue/portal-access";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const dateKey = url.searchParams.get("date")?.trim() || bangkokDateKey();
  const serviceId = Number(url.searchParams.get("serviceId") ?? "");
  const staffIdRaw = url.searchParams.get("staffId");
  const staffId = staffIdRaw && staffIdRaw !== "" ? Number(staffIdRaw) : null;

  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const rl = rateLimit(`aq-portal-slots:${ip}:${ownerId}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "โหลดถี่เกินไป" }, { status: 429 });

  const portalOk = await isAppointmentQueuePortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const scope = await resolveDataScopeBySlug(ownerId, APPOINTMENT_QUEUE_MODULE_SLUG);

  let durationMinutes: number | undefined;
  if (Number.isFinite(serviceId) && serviceId > 0) {
    const svc = await prisma.appointmentQueueService.findFirst({
      where: {
        id: serviceId,
        ownerUserId: ownerId,
        trialSessionId: scope.trialSessionId,
        isActive: true,
      },
    });
    if (!svc) return NextResponse.json({ error: "ไม่พบบริการ" }, { status: 400 });
    durationMinutes = svc.durationMinutes;
  }

  const result = await loadSlotAvailabilityForDate(
    prisma,
    ownerId,
    scope.trialSessionId,
    dateKey,
    durationMinutes,
    staffId,
  );
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    date: result.dateKey,
    openTime: result.openTime,
    closeTime: result.closeTime,
    slotMinutes: result.slotMinutes,
    isClosed: result.isClosed,
    slots: result.slots,
    availableCount: result.slots.filter((s) => s.available).length,
  });
}

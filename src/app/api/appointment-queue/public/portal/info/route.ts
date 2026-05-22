import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAppointmentQueuePortalOpenForOwner } from "@/lib/appointment-queue/portal-access";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const trialParam = url.searchParams.get("t")?.trim();

  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const rl = rateLimit(`aq-portal-info:${ip}:${ownerId}`, 40, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "โหลดถี่เกินไป" }, { status: 429 });
  }

  const portalOk = await isAppointmentQueuePortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const scope = await resolveDataScopeBySlug(ownerId, APPOINTMENT_QUEUE_MODULE_SLUG);
  const trialSessionId = trialParam && trialParam.length > 0 ? trialParam : scope.trialSessionId;

  const [profile, services, staff] = await Promise.all([
    prisma.appointmentQueueShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    }),
    prisma.appointmentQueueService.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.appointmentQueueStaff.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  if (!profile || !profile.publicBookingEnabled) {
    return NextResponse.json({ error: "ปิดรับจองชั่วคราว" }, { status: 403 });
  }

  return NextResponse.json({
    shop: {
      displayName: profile.displayName ?? "จองคิวออนไลน์",
      tagline: profile.tagline,
      contactPhone: profile.contactPhone,
      depositRequired: profile.depositRequired,
      depositAmountBaht:
        profile.depositAmountBaht != null ? Number(profile.depositAmountBaht) : null,
      promptPayId: profile.promptPayId,
      promptPayName: profile.promptPayName,
      bankAccountNote: profile.bankAccountNote,
    },
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      priceBaht: s.priceBaht != null ? Number(s.priceBaht) : null,
      depositBaht: s.depositBaht != null ? Number(s.depositBaht) : null,
    })),
    staff: staff.map((s) => ({ id: s.id, name: s.name })),
  });
}

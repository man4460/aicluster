import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { loadSlotAvailabilityForDate } from "@/lib/car-wash/booking-slot-availability";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";

export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const dateKey = url.searchParams.get("date")?.trim() || bangkokDateKey();

  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const rl = rateLimit(`car-wash-portal-slots:${ip}:${ownerId}`, 60, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "โหลดถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const portalOk = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  }

  const scope = await getCarWashDataScope(ownerId);
  const result = await loadSlotAvailabilityForDate(prisma, ownerId, scope.trialSessionId, dateKey);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { schedule, slotAvailability } = result;
  return NextResponse.json({
    date: schedule.dateKey,
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    slotMinutes: schedule.slotMinutes,
    isClosed: schedule.isClosed,
    slotAvailability: slotAvailability.map((s) => ({
      time: s.time,
      available: s.available,
      ...(s.status ? { status: s.status } : {}),
    })),
    availableCount: slotAvailability.filter((s) => s.available).length,
  });
}

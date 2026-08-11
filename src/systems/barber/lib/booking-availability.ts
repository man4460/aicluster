import { prisma } from "@/lib/prisma";
import { bangkokDayRangeFromDateKey } from "@/lib/barber/booking-datetime";
import {
  barberNormalizeDurationMinutes,
  barberParseHmToMinutes,
  barberRangesOverlap,
} from "@/systems/barber/lib/booking-slots";

export type BarberBusyRange = {
  startMin: number;
  endMin: number;
  bookingId: number;
  stylistId: number | null;
};

/** โหลดช่วงเวลาที่ถูกจองในวันนั้น (ไม่รวม CANCELLED) */
export async function loadBarberBusyRanges(opts: {
  ownerId: string;
  trialSessionId: string;
  dateKey: string;
  stylistId?: number | null;
}): Promise<BarberBusyRange[]> {
  const range = bangkokDayRangeFromDateKey(opts.dateKey);
  if (!range) return [];

  const rows = await prisma.barberBooking.findMany({
    where: {
      ownerUserId: opts.ownerId,
      trialSessionId: opts.trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
      status: { not: "CANCELLED" },
      ...(opts.stylistId != null
        ? {
            OR: [{ stylistId: opts.stylistId }, { stylistId: null }],
          }
        : {}),
    },
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
      stylistId: true,
    },
  });

  const out: BarberBusyRange[] = [];
  for (const row of rows) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(row.scheduledAt);
    const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
    const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
    const startMin = barberParseHmToMinutes(`${hh}:${mm}`);
    if (startMin == null) continue;
    const dur = barberNormalizeDurationMinutes(row.durationMinutes, 30);
    out.push({
      startMin,
      endMin: startMin + dur,
      bookingId: row.id,
      stylistId: row.stylistId,
    });
  }
  return out;
}

export function barberSlotRunConflicts(
  startHm: string,
  slotsCount: number,
  slotMinutes: number,
  busy: BarberBusyRange[],
): boolean {
  const startMin = barberParseHmToMinutes(startHm);
  if (startMin == null || slotsCount < 1) return true;
  const endMin = startMin + slotsCount * Math.max(15, slotMinutes);
  return busy.some((b) => barberRangesOverlap(startMin, endMin, b.startMin, b.endMin));
}

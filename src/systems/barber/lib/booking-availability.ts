import { prisma } from "@/lib/prisma";
import { bangkokDayRangeFromDateKey } from "@/lib/barber/booking-datetime";
import { formatBangkokTimeHm } from "@/lib/time/bangkok";
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

function bangkokHmFromDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hRaw = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mRaw = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const h = ((Number.isFinite(hRaw) ? hRaw : 0) % 24 + 24) % 24;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** โหลดช่วงเวลาที่ถูกจองในวันนั้น (ไม่รวม CANCELLED / NO_SHOW — ว่างให้จองใหม่ได้) */
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
      status: { in: ["SCHEDULED", "ARRIVED"] },
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
    const startHm = bangkokHmFromDate(row.scheduledAt) || formatBangkokTimeHm(row.scheduledAt);
    const startMin = barberParseHmToMinutes(startHm);
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

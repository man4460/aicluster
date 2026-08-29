import { prisma } from "@/lib/prisma";
import { bangkokDayRangeFromDateKey } from "@/lib/massage/booking-datetime";
import { formatBangkokTimeHm } from "@/lib/time/bangkok";
import {
  massageNormalizeDurationMinutes,
  massageParseHmToMinutes,
  massageRangesOverlap,
} from "@/systems/massage/lib/booking-slots";

export type MassageBusyRange = {
  startMin: number;
  endMin: number;
  bookingId: number;
  therapistId: number | null;
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

/** โหลดช่วงเวลาที่ถูกจองในวันนั้น (ไม่รวม CANCELLED / NO_SHOW) */
export async function loadMassageBusyRanges(opts: {
  ownerId: string;
  trialSessionId: string;
  dateKey: string;
  therapistId?: number | null;
}): Promise<MassageBusyRange[]> {
  const range = bangkokDayRangeFromDateKey(opts.dateKey);
  if (!range) return [];

  const rows = await prisma.massageBooking.findMany({
    where: {
      ownerUserId: opts.ownerId,
      trialSessionId: opts.trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
      status: { in: ["SCHEDULED", "ARRIVED", "IN_SERVICE"] },
      ...(opts.therapistId != null
        ? {
            OR: [{ therapistId: opts.therapistId }, { therapistId: null }],
          }
        : {}),
    },
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
      therapistId: true,
    },
  });

  const out: MassageBusyRange[] = [];
  for (const row of rows) {
    const startHm = bangkokHmFromDate(row.scheduledAt) || formatBangkokTimeHm(row.scheduledAt);
    const startMin = massageParseHmToMinutes(startHm);
    if (startMin == null) continue;
    const dur = massageNormalizeDurationMinutes(row.durationMinutes, 60);
    out.push({
      startMin,
      endMin: startMin + dur,
      bookingId: row.id,
      therapistId: row.therapistId,
    });
  }
  return out;
}

export function massageSlotRunConflicts(
  startHm: string,
  slotsCount: number,
  slotMinutes: number,
  busy: MassageBusyRange[],
): boolean {
  const startMin = massageParseHmToMinutes(startHm);
  if (startMin == null || slotsCount < 1) return true;
  const endMin = startMin + slotsCount * Math.max(15, slotMinutes);
  return busy.some((b) => massageRangesOverlap(startMin, endMin, b.startMin, b.endMin));
}

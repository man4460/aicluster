import type { PrismaClient } from "@/generated/prisma/client";

export const PARKING_PORTAL_PAYMENT_MODES = ["NONE", "DEPOSIT", "FULL"] as const;
export type ParkingPortalPaymentMode = (typeof PARKING_PORTAL_PAYMENT_MODES)[number];

export function normalizeParkingPortalPaymentMode(raw: unknown): ParkingPortalPaymentMode {
  const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return value === "DEPOSIT" || value === "FULL" ? value : "NONE";
}

export function parkingPortalPayDueBaht(
  totalBaht: number,
  mode: ParkingPortalPaymentMode,
  depositPercent: number | null | undefined,
): number {
  const total = Math.max(0, Math.round(totalBaht));
  if (mode === "FULL") return total;
  if (mode === "DEPOSIT") {
    const percent = Math.max(0, Math.min(100, Math.round(Number(depositPercent ?? 0))));
    return Math.min(total, Math.round((total * percent) / 100));
  }
  return 0;
}

export function parkingPortalDate(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const date = new Date(`${ymd}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parkingPortalDays(startYmd: string, endYmd: string): number {
  const start = parkingPortalDate(startYmd);
  const end = parkingPortalDate(endYmd);
  if (!start || !end || end <= start) return 0;
  /** เหมือนโรงแรม: วันเริ่ม–วันสิ้นสุดแบบ exclusive (เช่น 30→31 = 1 วัน) */
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

export function parkingPortalSlipProofMessage(mode: ParkingPortalPaymentMode): string {
  if (mode === "FULL") return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง";
  if (mode === "DEPOSIT") return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง";
  return "";
}

/** ช่วงจอง [start, end) ทับกันหรือไม่ — เหมือนโรงแรม */
export function parkingPortalRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export type ParkingPortalSpotCard = {
  id: number;
  siteId: number;
  siteName: string;
  spotCode: string;
  zoneLabel: string | null;
  sortFloor: number;
  dailyRateBaht: number;
  days: number;
  totalBaht: number;
  payDueBaht: number;
  bookingPaymentMode: ParkingPortalPaymentMode;
};

/**
 * ช่องจอดว่างในช่วง [start, end) — ไม่มี ACTIVE session และไม่ทับจอง SCHEDULED/CHECKED_IN
 */
export async function parkingListAvailablePortalSpots(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
  opts?: { siteId?: number },
): Promise<ParkingPortalSpotCard[]> {
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  if (days < 1 || end <= start) return [];

  const sites = await prisma.parkingSite.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      isActive: true,
      dailyRateBaht: { not: null },
      ...(opts?.siteId ? { id: opts.siteId } : {}),
    },
    select: {
      id: true,
      name: true,
      dailyRateBaht: true,
      bookingPaymentMode: true,
      depositPercent: true,
      spots: {
        select: {
          id: true,
          spotCode: true,
          zoneLabel: true,
          sortFloor: true,
          sortOrder: true,
        },
        orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { spotCode: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const spotIds = sites.flatMap((s) => s.spots.map((sp) => sp.id));
  if (!spotIds.length) return [];

  const [activeSessions, blockingBookings] = await Promise.all([
    prisma.parkingSession.findMany({
      where: { spotId: { in: spotIds }, status: "ACTIVE" },
      select: { spotId: true },
    }),
    prisma.parkingBooking.findMany({
      where: {
        ownerUserId,
        trialSessionId,
        spotId: { in: spotIds },
        status: { in: ["SCHEDULED", "CHECKED_IN"] },
        scheduledStart: { lt: end },
      },
      select: { spotId: true, scheduledStart: true, scheduledEnd: true },
    }),
  ]);

  const busy = new Set<number>();
  for (const row of activeSessions) busy.add(row.spotId);
  for (const b of blockingBookings) {
    if (b.spotId == null) continue;
    const bEnd = b.scheduledEnd ?? new Date(b.scheduledStart.getTime() + 86_400_000);
    if (parkingPortalRangesOverlap(start, end, b.scheduledStart, bEnd)) {
      busy.add(b.spotId);
    }
  }

  const cards: ParkingPortalSpotCard[] = [];
  for (const site of sites) {
    const rate = Math.round(Number(site.dailyRateBaht ?? 0));
    const mode = normalizeParkingPortalPaymentMode(site.bookingPaymentMode);
    const totalBaht = Math.round(rate * days);
    const payDueBaht = parkingPortalPayDueBaht(totalBaht, mode, site.depositPercent);
    for (const spot of site.spots) {
      if (busy.has(spot.id)) continue;
      cards.push({
        id: spot.id,
        siteId: site.id,
        siteName: site.name,
        spotCode: spot.spotCode,
        zoneLabel: spot.zoneLabel,
        sortFloor: spot.sortFloor,
        dailyRateBaht: rate,
        days,
        totalBaht,
        payDueBaht,
        bookingPaymentMode: mode,
      });
    }
  }
  return cards;
}

export async function parkingIsPortalSpotAvailable(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  spotId: number,
  start: Date,
  end: Date,
): Promise<boolean> {
  const rows = await parkingListAvailablePortalSpots(prisma, ownerUserId, trialSessionId, start, end);
  return rows.some((r) => r.id === spotId);
}

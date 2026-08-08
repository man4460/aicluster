import type { PrismaClient } from "@/generated/prisma/client";
import { nightsBetween } from "@/systems/hotel-resort/lib/room-status";
import { hotelResortNormalizeRoomImageUrls } from "@/systems/hotel-resort/lib/room-images";
import {
  hotelResortAmenityLabel,
  parseHotelResortAmenities,
} from "@/systems/hotel-resort/lib/room-amenities";

export const HOTEL_PORTAL_PAYMENT_MODES = ["NONE", "DEPOSIT", "FULL"] as const;
export type HotelPortalBookingPaymentMode = (typeof HOTEL_PORTAL_PAYMENT_MODES)[number];

export function hotelResortNormalizePortalPaymentMode(raw: unknown): HotelPortalBookingPaymentMode {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (s === "DEPOSIT" || s === "FULL" || s === "NONE") return s;
  return "NONE";
}

export function hotelResortParsePortalStayDate(
  ymd: string,
  timeHm: string,
): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const [hhRaw, mmRaw] = timeHm.split(":");
  const hh = Math.min(23, Math.max(0, Number(hhRaw) || 0));
  const mm = Math.min(59, Math.max(0, Number(mmRaw) || 0));
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hh, mm, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ช่วง [checkIn, checkOut) ทับกันหรือไม่ */
export function hotelResortStayRangesOverlap(
  aIn: Date,
  aOut: Date,
  bIn: Date,
  bOut: Date,
): boolean {
  return aIn.getTime() < bOut.getTime() && bIn.getTime() < aOut.getTime();
}

export type HotelPortalRoomCard = {
  id: string;
  roomNumber: string;
  floor: number;
  buildingName: string | null;
  roomTypeId: string;
  roomTypeName: string;
  basePriceBaht: number;
  maxGuests: number;
  bedType: string | null;
  roomSizeSqm: number | null;
  viewType: string | null;
  amenities: { key: string; label: string }[];
  imageUrls: string[];
  note: string | null;
  nights: number;
  totalBaht: number;
};

export async function hotelResortListAvailablePortalRooms(
  prisma: PrismaClient,
  ownerUserId: string,
  checkInAt: Date,
  checkOutAt: Date,
): Promise<HotelPortalRoomCard[]> {
  const nights = nightsBetween(checkInAt, checkOutAt);
  if (nights < 1) return [];

  const [rooms, amenityOpts, blocking] = await Promise.all([
    prisma.hotelResortRoom.findMany({
      where: {
        ownerUserId,
        status: { not: "MAINTENANCE" },
      },
      include: {
        building: { select: { name: true } },
        roomType: { select: { id: true, name: true, basePriceBaht: true, maxGuests: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { roomNumber: "asc" }],
    }),
    prisma.hotelResortAmenityOption.findMany({
      where: { ownerUserId },
      select: { key: true, label: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.hotelResortBooking.findMany({
      where: {
        ownerUserId,
        roomId: { not: null },
        status: { in: ["RESERVED", "CHECKED_IN"] },
        checkInAt: { lt: checkOutAt },
        checkOutAt: { gt: checkInAt },
      },
      select: { roomId: true, checkInAt: true, checkOutAt: true },
    }),
  ]);

  const busy = new Set<string>();
  for (const b of blocking) {
    if (!b.roomId) continue;
    if (hotelResortStayRangesOverlap(checkInAt, checkOutAt, b.checkInAt, b.checkOutAt)) {
      busy.add(b.roomId);
    }
  }

  return rooms
    .filter((r) => !busy.has(r.id))
    .map((r) => {
      const keys = parseHotelResortAmenities(r.amenitiesJson);
      const price = r.roomType.basePriceBaht;
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        floor: r.floor,
        buildingName: r.building?.name ?? null,
        roomTypeId: r.roomType.id,
        roomTypeName: r.roomType.name,
        basePriceBaht: price,
        maxGuests: r.roomType.maxGuests,
        bedType: r.bedType,
        roomSizeSqm: r.roomSizeSqm,
        viewType: r.viewType,
        amenities: keys.map((key) => ({
          key,
          label: hotelResortAmenityLabel(key, amenityOpts),
        })),
        imageUrls: hotelResortNormalizeRoomImageUrls(r.imageUrlsJson),
        note: r.note,
        nights,
        totalBaht: nights * price,
      };
    });
}

export function hotelResortComputePortalPayDue(opts: {
  mode: HotelPortalBookingPaymentMode;
  depositAmountBaht: number | null | undefined;
  totalBaht: number;
}): number | null {
  if (opts.mode === "NONE") return null;
  if (opts.mode === "FULL") return Math.max(0, Math.round(opts.totalBaht));
  const dep = Math.max(0, Math.round(Number(opts.depositAmountBaht ?? 0)));
  if (dep <= 0) return null;
  return Math.min(dep, Math.max(0, Math.round(opts.totalBaht)));
}

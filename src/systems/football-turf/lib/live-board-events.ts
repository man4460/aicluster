import type {
  FootballTurfBooking,
  FootballTurfCourt,
  FootballTurfCustomer,
  FootballTurfPromotion,
  FootballTurfPromotionSale,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";
import { sameFootballTurfCustomer } from "@/systems/football-turf/lib/booking-session";

/** เหตุการณ์ SSE — ส่งเฉพาะส่วนที่เปลี่ยน ไม่บังคับ refresh ทั้ง state */
export type FootballTurfLiveEvent =
  | { type: "hello"; at: string }
  | { type: "booking.upsert"; at: string; bookings: FootballTurfBooking[] }
  | { type: "booking.delete"; at: string; ids: number[] }
  | {
      type: "booking.sessionStatus";
      at: string;
      courtId: number;
      bookingDate: string;
      customerName: string;
      customerPhone: string;
      status: "CHECKED_IN" | "PLAYING" | "COMPLETED";
    }
  | { type: "court.upsert"; at: string; courts: FootballTurfCourt[] }
  | { type: "court.delete"; at: string; ids: number[] }
  | { type: "customer.upsert"; at: string; customers: FootballTurfCustomer[] }
  | { type: "customer.delete"; at: string; ids: number[] }
  | { type: "promotion.upsert"; at: string; promotions: FootballTurfPromotion[] }
  | { type: "promotion.delete"; at: string; ids: number[] }
  | { type: "promotionSale.upsert"; at: string; sales: FootballTurfPromotionSale[] }
  | { type: "promotionSale.delete"; at: string; ids: number[] }
  | { type: "settings.upsert"; at: string; settings: FootballTurfVenueSettings }
  | { type: "refresh"; at: string };

export function footballTurfLiveAt(): string {
  return new Date().toISOString();
}

export function upsertById<T extends { id: number }>(rows: T[], next: T[]): T[] {
  if (next.length === 0) return rows;
  const map = new Map(rows.map((row) => [row.id, row]));
  for (const row of next) map.set(row.id, row);
  return [...map.values()];
}

export function removeByIds<T extends { id: number }>(rows: T[], ids: number[]): T[] {
  if (ids.length === 0) return rows;
  const drop = new Set(ids);
  return rows.filter((row) => !drop.has(row.id));
}

/** ใช้ฝั่ง client กับ state ท้องถิ่น — คืนเฉพาะฟิลด์ที่เปลี่ยน (ไม่รวม hello) */
export function applyFootballTurfLiveEventToBookings(
  bookings: FootballTurfBooking[],
  event: FootballTurfLiveEvent,
): FootballTurfBooking[] | null {
  if (event.type === "booking.upsert") {
    return upsertById(bookings, event.bookings);
  }
  if (event.type === "booking.delete") {
    return removeByIds(bookings, event.ids);
  }
  if (event.type === "booking.sessionStatus") {
    return bookings.map((row) => {
      if (row.courtId !== event.courtId || row.bookingDate !== event.bookingDate) return row;
      if (row.status === "CANCELLED" || row.status === "COMPLETED") return row;
      if (
        !sameFootballTurfCustomer(
          { customerName: event.customerName, customerPhone: event.customerPhone },
          row,
        )
      ) {
        return row;
      }
      if (event.status === "COMPLETED") {
        if (row.status === "BOOKED" || row.status === "CHECKED_IN" || row.status === "PLAYING") {
          return { ...row, status: "COMPLETED" };
        }
        return row;
      }
      if (row.status === "BOOKED") {
        return { ...row, status: "CHECKED_IN" };
      }
      return row;
    });
  }
  return null;
}

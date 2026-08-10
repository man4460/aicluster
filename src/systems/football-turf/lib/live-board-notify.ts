import {
  footballTurfLiveAt,
  type FootballTurfLiveEvent,
} from "@/systems/football-turf/lib/live-board-events";
import { notifyFootballTurfLiveBoard } from "@/systems/football-turf/lib/live-board-sse";
import type {
  FootballTurfBooking,
  FootballTurfCourt,
  FootballTurfCustomer,
  FootballTurfPromotion,
  FootballTurfPromotionSale,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";

function emit(ownerUserId: string, event: FootballTurfLiveEvent) {
  notifyFootballTurfLiveBoard(ownerUserId, event);
}

function asBooking(value: unknown): FootballTurfBooking | null {
  if (!value || typeof value !== "object") return null;
  const row = value as FootballTurfBooking;
  return typeof row.id === "number" ? row : null;
}

function asBookings(value: unknown): FootballTurfBooking[] {
  if (Array.isArray(value)) {
    return value.map(asBooking).filter((row): row is FootballTurfBooking => row != null);
  }
  const one = asBooking(value);
  return one ? [one] : [];
}

/** แปลงผล action → SSE patch (เฉพาะ entity ที่แก้) */
export function notifyFootballTurfActionLive(
  ownerUserId: string,
  op: string,
  result: unknown,
  id?: number,
  input?: Record<string, unknown>,
): void {
  const at = footballTurfLiveAt();

  switch (op) {
    case "createBooking":
    case "updateBooking": {
      const bookings = asBookings(result);
      if (bookings.length === 0) break;
      emit(ownerUserId, { type: "booking.upsert", at, bookings });
      const statusPatch = input?.status;
      if (
        op === "updateBooking" &&
        (statusPatch === "CHECKED_IN" || statusPatch === "PLAYING" || statusPatch === "COMPLETED")
      ) {
        const primary = bookings[0]!;
        emit(ownerUserId, {
          type: "booking.sessionStatus",
          at,
          courtId: primary.courtId,
          bookingDate: primary.bookingDate,
          customerName: primary.customerName,
          customerPhone: primary.customerPhone,
          status: statusPatch === "PLAYING" ? "CHECKED_IN" : statusPatch,
        });
      }
      break;
    }
    case "createOnlineBookingsBatch": {
      const bookings = asBookings(result);
      if (bookings.length > 0) emit(ownerUserId, { type: "booking.upsert", at, bookings });
      break;
    }
    case "deleteBooking": {
      if (id != null) emit(ownerUserId, { type: "booking.delete", at, ids: [id] });
      break;
    }
    case "createCourt":
    case "updateCourt": {
      const court = result as FootballTurfCourt | null;
      if (court && typeof court.id === "number") {
        emit(ownerUserId, { type: "court.upsert", at, courts: [court] });
      }
      break;
    }
    case "deleteCourt": {
      if (id != null) emit(ownerUserId, { type: "court.delete", at, ids: [id] });
      break;
    }
    case "createCustomer":
    case "updateCustomer": {
      const customer = result as FootballTurfCustomer | null;
      if (customer && typeof customer.id === "number") {
        emit(ownerUserId, { type: "customer.upsert", at, customers: [customer] });
      }
      break;
    }
    case "deleteCustomer": {
      if (id != null) emit(ownerUserId, { type: "customer.delete", at, ids: [id] });
      break;
    }
    case "createPromotion":
    case "updatePromotion": {
      const promotion = result as FootballTurfPromotion | null;
      if (promotion && typeof promotion.id === "number") {
        emit(ownerUserId, { type: "promotion.upsert", at, promotions: [promotion] });
      }
      break;
    }
    case "deletePromotion": {
      if (id != null) emit(ownerUserId, { type: "promotion.delete", at, ids: [id] });
      break;
    }
    case "createPromotionSale":
    case "updatePromotionSale":
    case "usePromotionSale": {
      const sale = result as FootballTurfPromotionSale | null;
      if (sale && typeof sale.id === "number") {
        emit(ownerUserId, { type: "promotionSale.upsert", at, sales: [sale] });
      }
      break;
    }
    case "deletePromotionSale": {
      if (id != null) emit(ownerUserId, { type: "promotionSale.delete", at, ids: [id] });
      break;
    }
    case "updateSettings": {
      const settings = result as FootballTurfVenueSettings | null;
      if (settings && typeof settings.venueName === "string") {
        emit(ownerUserId, { type: "settings.upsert", at, settings });
      }
      break;
    }
    default: {
      // รายรับ/รายจ่าย ฯลฯ — ให้ client refresh เฉพาะเมื่อจำเป็น
      if (
        op.startsWith("createCost") ||
        op.startsWith("updateCost") ||
        op.startsWith("deleteCost") ||
        op.startsWith("createIncome") ||
        op.startsWith("updateIncome") ||
        op.startsWith("deleteIncome")
      ) {
        emit(ownerUserId, { type: "refresh", at });
      }
      break;
    }
  }
}

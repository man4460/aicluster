import type {
  FootballTurfBooking,
  FootballTurfBookingPaymentMethod,
  FootballTurfBookingPaymentStatus,
  FootballTurfBookingSource,
  FootballTurfBookingStatus,
  FootballTurfCostCategory,
  FootballTurfCostEntry,
  FootballTurfCourt,
  FootballTurfCustomer,
  FootballTurfPromotion,
  FootballTurfPromotionKind,
  FootballTurfPromotionSale,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";
import type {
  FootballTurfBooking as DbBooking,
  FootballTurfCostCategory as DbCostCategory,
  FootballTurfCostEntry as DbCostEntry,
  FootballTurfCourt as DbCourt,
  FootballTurfCustomer as DbCustomer,
  FootballTurfPromotion as DbPromotion,
  FootballTurfPromotionSale as DbPromotionSale,
  FootballTurfShopProfile as DbProfile,
} from "@/generated/prisma/client";

export function formatBookingDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseBookingDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function mapProfileToSettings(row: DbProfile): FootballTurfVenueSettings {
  return {
    venueName: row.venueName,
    venueSubtitle: row.venueSubtitle,
    promptpayNumber: row.promptpayNumber,
    bankName: row.bankName,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    venueAddress: row.venueAddress,
    taxId: row.taxId,
    contactPhone: row.contactPhone,
    contactLine: row.contactLine,
    note: row.note,
  };
}

export function mapCourt(row: DbCourt): FootballTurfCourt {
  return {
    id: row.id,
    name: row.name,
    openTime: row.openTime,
    closeTime: row.closeTime,
    slotMinutes: row.slotMinutes,
    weekdayPrice: row.weekdayPrice,
    weekendPrice: row.weekendPrice,
    isActive: row.isActive,
  };
}

export function mapCustomer(row: DbCustomer): FootballTurfCustomer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    teamName: row.teamName,
    note: row.note,
    isActive: row.isActive,
  };
}

export function mapPromotion(row: DbPromotion): FootballTurfPromotion {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as FootballTurfPromotionKind,
    totalUses: row.totalUses,
    durationMinutes: row.durationMinutes,
    price: row.price,
    isActive: row.isActive,
    note: row.note,
  };
}

export function mapPromotionSale(row: DbPromotionSale): FootballTurfPromotionSale {
  return {
    id: row.id,
    promotionId: row.promotionId,
    promotionName: row.promotionName,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    teamName: row.teamName,
    totalUses: row.totalUses,
    remainingUses: row.remainingUses,
    price: row.price,
    status: row.status as FootballTurfPromotionSale["status"],
    paymentMethod: (row.paymentMethod as FootballTurfPromotionSale["paymentMethod"]) ?? "ONSITE",
    paymentStatus: (row.paymentStatus as FootballTurfBookingPaymentStatus) ?? "PAID",
    paymentSlipDataUrl: row.paymentSlipDataUrl ?? "",
    paymentReference: row.paymentReference ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapCostCategory(row: DbCostCategory): FootballTurfCostCategory {
  return { id: row.id, name: row.name };
}

export function mapCostEntry(row: DbCostEntry, categoryName: string): FootballTurfCostEntry {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName,
    spentAt: row.spentAt.toISOString(),
    amount: row.amount,
    itemLabel: row.itemLabel,
    note: row.note,
  };
}

export function mapBooking(row: DbBooking & { court?: { name: string } | null }, courtName?: string): FootballTurfBooking {
  return {
    id: row.id,
    courtId: row.courtId,
    courtName: courtName ?? row.court?.name ?? "",
    bookingDate: formatBookingDate(row.bookingDate),
    startTime: row.startTime,
    endTime: row.endTime,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    teamName: row.teamName,
    playerCount: row.playerCount,
    source: row.source as FootballTurfBookingSource,
    status: row.status as FootballTurfBookingStatus,
    listedPrice: row.listedPrice,
    finalPrice: row.finalPrice,
    promotionSaleId: row.promotionSaleId,
    note: row.note,
    paymentMethod: row.paymentMethod as FootballTurfBookingPaymentMethod,
    paymentStatus: row.paymentStatus as FootballTurfBookingPaymentStatus,
    paymentSlipDataUrl: row.paymentSlipDataUrl ?? "",
    paymentReference: row.paymentReference,
    createdAt: row.createdAt.toISOString(),
  };
}

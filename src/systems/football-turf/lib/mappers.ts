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
  FootballTurfIncomeCategory,
  FootballTurfIncomeEntry,
  FootballTurfPromotion,
  FootballTurfPromotionKind,
  FootballTurfPromotionSale,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { normalizeFootballTurfPortalPaymentMode } from "@/systems/football-turf/lib/portal-booking";
import { footballTurfNormalizePortalGallery } from "@/systems/football-turf/lib/portal-media";
import type {
  FootballTurfBooking as DbBooking,
  FootballTurfCostCategory as DbCostCategory,
  FootballTurfCostEntry as DbCostEntry,
  FootballTurfCourt as DbCourt,
  FootballTurfCustomer as DbCustomer,
  FootballTurfIncomeCategory as DbIncomeCategory,
  FootballTurfIncomeEntry as DbIncomeEntry,
  FootballTurfPromotion as DbPromotion,
  FootballTurfPromotionSale as DbPromotionSale,
  FootballTurfShopProfile as DbProfile,
} from "@/generated/prisma/client";

export function formatBookingDate(date: Date): string {
  return bangkokDateKey(date);
}

export function parseBookingDate(value: string): Date {
  // เก็บเป็นกลางวันไทย — กันเลื่อนวันเมื่อ serialize ข้ามโซนเวลา
  return new Date(`${value}T12:00:00+07:00`);
}

export function mapProfileToSettings(
  row: DbProfile,
  extras?: { staffDailyPinSet?: boolean },
): FootballTurfVenueSettings {
  return {
    venueName: row.venueName,
    venueSubtitle: row.venueSubtitle,
    logoUrl: row.logoUrl ?? "",
    promptpayNumber: row.promptpayNumber,
    promptPayQrImageUrl: row.promptPayQrImageUrl ?? "",
    bankName: row.bankName,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    venueAddress: row.venueAddress,
    taxId: row.taxId,
    contactPhone: row.contactPhone,
    contactLine: row.contactLine,
    note: row.note,
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize),
    portalBookingPaymentMode: normalizeFootballTurfPortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht ?? null,
    portalBannerUrl: row.portalBannerUrl ?? "",
    portalGallery: footballTurfNormalizePortalGallery(row.portalGalleryJson),
    facebookUrl: row.facebookUrl ?? "",
    mapUrl: row.mapUrl ?? "",
    staffDailyPinSet: Boolean(extras?.staffDailyPinSet),
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
    imageUrl: row.imageUrl ?? "",
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
    taxInvoiceEnabled: row.taxInvoiceEnabled,
    billingName: row.billingName,
    taxId: row.taxId,
    taxAddress: row.taxAddress,
    taxBranch: row.taxBranch,
    photoUrl: row.photoUrl ?? "",
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
    paymentSlipUrl: row.paymentSlipUrl ?? "",
  };
}

export function mapIncomeCategory(row: DbIncomeCategory): FootballTurfIncomeCategory {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as FootballTurfIncomeCategory["kind"],
    isBuiltin: row.isBuiltin,
    sortOrder: row.sortOrder,
  };
}

export function mapIncomeEntry(row: DbIncomeEntry, categoryName: string): FootballTurfIncomeEntry {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName,
    earnedAt: row.earnedAt.toISOString(),
    amount: row.amount,
    itemLabel: row.itemLabel,
    note: row.note,
    paymentSlipUrl: row.paymentSlipUrl ?? "",
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
    depositAmountBaht: row.depositAmountBaht ?? null,
    amountPaidBaht: (() => {
      const paid = row.amountPaidBaht ?? 0;
      if ((row.paymentStatus as string) === "PAID" && paid <= 0) return row.finalPrice;
      return paid;
    })(),
    promotionSaleId: row.promotionSaleId,
    signatureImageUrl: row.signatureImageUrl ?? null,
    note: row.note,
    paymentMethod: row.paymentMethod as FootballTurfBookingPaymentMethod,
    paymentStatus: row.paymentStatus as FootballTurfBookingPaymentStatus,
    paymentSlipDataUrl: row.paymentSlipDataUrl ?? "",
    paymentReference: row.paymentReference,
    createdAt: row.createdAt.toISOString(),
  };
}

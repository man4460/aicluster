import type { UsedCarShowroomCardTone } from "@/systems/used-car-showroom/lib/card-tones";

export const USED_CAR_VEHICLE_STATUSES = [
  "PREP",
  "FOR_SALE",
  "RESERVED",
  "SOLD",
  "DELIVERED",
] as const;

export type UsedCarVehicleStatus = (typeof USED_CAR_VEHICLE_STATUSES)[number];

export function usedCarVehicleStatusLabel(status: string): string {
  switch (status) {
    case "PREP":
      return "รอปรับสภาพ";
    case "FOR_SALE":
      return "พร้อมขาย";
    case "RESERVED":
      return "ติดจอง";
    case "SOLD":
      return "ขายแล้ว";
    case "DELIVERED":
      return "ส่งมอบแล้ว";
    default:
      return status;
  }
}

export function usedCarVehicleStatusTone(status: string): UsedCarShowroomCardTone {
  switch (status) {
    case "PREP":
      return "amber";
    case "FOR_SALE":
      return "emerald";
    case "RESERVED":
      return "sky";
    case "SOLD":
      return "violet";
    case "DELIVERED":
      return "slate";
    default:
      return "slate";
  }
}

export function isUsedCarVehicleStatus(raw: unknown): raw is UsedCarVehicleStatus {
  return typeof raw === "string" && (USED_CAR_VEHICLE_STATUSES as readonly string[]).includes(raw);
}

export const USED_CAR_COST_KINDS = ["REPAIR", "WASH", "TAX", "OTHER"] as const;
export type UsedCarCostKind = (typeof USED_CAR_COST_KINDS)[number];

export function usedCarCostKindLabel(kind: string): string {
  switch (kind) {
    case "REPAIR":
      return "ซ่อม";
    case "WASH":
      return "ล้าง";
    case "TAX":
      return "ภาษี/ทะเบียน";
    case "OTHER":
      return "อื่น ๆ";
    default:
      return kind;
  }
}

export const USED_CAR_PORTAL_PAYMENT_MODES = ["NONE", "DEPOSIT", "FULL"] as const;
export type UsedCarPortalPaymentMode = (typeof USED_CAR_PORTAL_PAYMENT_MODES)[number];

export function parseUsedCarPortalPaymentMode(raw: unknown): UsedCarPortalPaymentMode {
  if (raw === "NONE" || raw === "DEPOSIT" || raw === "FULL") return raw;
  return "DEPOSIT";
}

/** สถานะการจองกันคัน */
export const USED_CAR_RESERVATION_STATUSES = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "CANCELLED",
  "CONVERTED",
] as const;

export type UsedCarReservationStatus = (typeof USED_CAR_RESERVATION_STATUSES)[number];

export function usedCarReservationStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "รอชำระมัดจำ";
    case "PAID":
      return "ชำระมัดจำแล้ว";
    case "EXPIRED":
      return "หมดอายุ";
    case "CANCELLED":
      return "ยกเลิก";
    case "CONVERTED":
      return "แปลงเป็นขายแล้ว";
    default:
      return status;
  }
}

export function usedCarReservationStatusTone(status: string): UsedCarShowroomCardTone {
  switch (status) {
    case "PENDING":
      return "amber";
    case "PAID":
      return "emerald";
    case "EXPIRED":
      return "slate";
    case "CANCELLED":
      return "rose";
    case "CONVERTED":
      return "violet";
    default:
      return "sky";
  }
}

export function isUsedCarReservationStatus(raw: unknown): raw is UsedCarReservationStatus {
  return typeof raw === "string" && (USED_CAR_RESERVATION_STATUSES as readonly string[]).includes(raw);
}

export function usedCarReservationSourceLabel(source: string): string {
  switch (source) {
    case "WEB":
      return "เว็บลูกค้า";
    case "STAFF":
      return "พนักงาน";
    default:
      return source;
  }
}

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

/** สถานะนัดดูรถ / ทดลองขับ */
export const USED_CAR_APPOINTMENT_STATUSES = ["SCHEDULED", "DONE", "CANCELLED", "NO_SHOW"] as const;

export type UsedCarAppointmentStatus = (typeof USED_CAR_APPOINTMENT_STATUSES)[number];

export function usedCarAppointmentStatusLabel(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "นัดแล้ว";
    case "DONE":
      return "มาแล้ว";
    case "CANCELLED":
      return "ยกเลิก";
    case "NO_SHOW":
      return "ไม่มา";
    default:
      return status;
  }
}

export function usedCarAppointmentKindLabel(kind: string): string {
  switch (kind) {
    case "TEST_DRIVE":
      return "ทดลองขับ";
    case "VIEW":
      return "ดูรถ";
    default:
      return kind;
  }
}

export function isUsedCarAppointmentStatus(raw: unknown): raw is UsedCarAppointmentStatus {
  return typeof raw === "string" && (USED_CAR_APPOINTMENT_STATUSES as readonly string[]).includes(raw);
}

/** สถานะเคสไฟแนนซ์ */
export const USED_CAR_FINANCE_CASE_STATUSES = [
  "SUBMITTED",
  "WAITING_DOCS",
  "APPROVED",
  "REJECTED",
  "SIGNED",
] as const;

export type UsedCarFinanceCaseStatus = (typeof USED_CAR_FINANCE_CASE_STATUSES)[number];

/** สถานะที่ถือว่า «รอ» บนแท็บไฟแนนซ์รอ */
export const USED_CAR_FINANCE_PENDING_STATUSES = ["SUBMITTED", "WAITING_DOCS"] as const;

export type UsedCarFinancePendingStatus = (typeof USED_CAR_FINANCE_PENDING_STATUSES)[number];

export function usedCarFinanceCaseStatusLabel(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "ส่งแล้ว";
    case "WAITING_DOCS":
      return "รอเอกสาร";
    case "APPROVED":
      return "อนุมัติ";
    case "REJECTED":
      return "ไม่อนุมัติ";
    case "SIGNED":
      return "เซ็นสัญญา";
    default:
      return status;
  }
}

export function isUsedCarFinancePendingStatus(raw: unknown): raw is UsedCarFinancePendingStatus {
  return typeof raw === "string" && (USED_CAR_FINANCE_PENDING_STATUSES as readonly string[]).includes(raw);
}

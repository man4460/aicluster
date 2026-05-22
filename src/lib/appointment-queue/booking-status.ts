import type { AppointmentQueueBookingStatus } from "@/generated/prisma/enums";

export const APPOINTMENT_QUEUE_STATUS_LABEL: Record<AppointmentQueueBookingStatus, string> = {
  PENDING_DEPOSIT: "รอมัดจำ",
  CONFIRMED: "จองแล้ว",
  IN_SERVICE: "จองแล้ว",
  COMPLETED: "จองแล้ว",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มาตามนัด",
};

/** คิวที่แสดงในรายการวัน (ไม่รวมยกเลิก/ไม่มา) */
export const ACTIVE_QUEUE_STATUSES: AppointmentQueueBookingStatus[] = [
  "CONFIRMED",
  "IN_SERVICE",
  "COMPLETED",
];

export function statusBadgeClass(status: AppointmentQueueBookingStatus): string {
  switch (status) {
    case "PENDING_DEPOSIT":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "CONFIRMED":
      return "bg-indigo-100 text-indigo-900 ring-indigo-200";
    case "IN_SERVICE":
      return "bg-violet-100 text-violet-900 ring-violet-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "CANCELLED":
      return "bg-slate-200 text-slate-700 ring-slate-300";
    case "NO_SHOW":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

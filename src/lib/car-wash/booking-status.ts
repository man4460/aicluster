export type BookingUiTone = "default" | "success" | "warning" | "danger" | "muted";

export type CarWashBookingStatusUi =
  | "SCHEDULED"
  | "ARRIVED"
  | "IN_SERVICE"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export function carWashBookingUiLabel(
  status: CarWashBookingStatusUi,
  scheduledAt: Date | string,
  now: Date | string | number = new Date(),
): { primary: string; secondary?: string; tone: BookingUiTone } {
  const at = toDate(scheduledAt);
  const n = toDate(now);
  if (status === "ARRIVED") return { primary: "มาถึงแล้ว", tone: "success" };
  if (status === "IN_SERVICE") return { primary: "กำลังล้าง", tone: "success" };
  if (status === "COMPLETED") return { primary: "เสร็จแล้ว", tone: "success" };
  if (status === "NO_SHOW") return { primary: "ไม่มา", tone: "danger" };
  if (status === "CANCELLED") return { primary: "ยกเลิก", tone: "muted" };
  if (at.getTime() < n.getTime()) {
    return { primary: "เลยเวลานัด", secondary: "ยังไม่มาใช้บริการ", tone: "warning" };
  }
  return { primary: "รอเข้าใช้", tone: "default" };
}

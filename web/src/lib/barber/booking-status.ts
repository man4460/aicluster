export type BookingUiTone = "default" | "success" | "warning" | "danger" | "muted";

export type BarberBookingStatusUi = "SCHEDULED" | "ARRIVED" | "NO_SHOW" | "CANCELLED";

export function bookingUiLabel(
  status: BarberBookingStatusUi,
  scheduledAt: Date,
  now = new Date(),
): { primary: string; secondary?: string; tone: BookingUiTone } {
  if (status === "ARRIVED") return { primary: "มาใช้บริการแล้ว", tone: "success" };
  if (status === "NO_SHOW") return { primary: "ไม่มา", tone: "danger" };
  if (status === "CANCELLED") return { primary: "ยกเลิก", tone: "muted" };
  if (scheduledAt.getTime() < now.getTime()) {
    return { primary: "เลยเวลานัด", secondary: "ยังไม่มาใช้บริการ", tone: "warning" };
  }
  return { primary: "รอเข้าใช้", tone: "default" };
}

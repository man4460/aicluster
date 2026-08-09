import { timeToMinutes } from "@/systems/football-turf/lib/time-queue";

/** จับคู่ลูกค้าเดียวกันจากเบอร์ (ตัวเลข) หรือชื่อ */
export function normalizeFootballCustomerPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function sameFootballTurfCustomer(
  a: { customerName: string; customerPhone: string },
  b: { customerName: string; customerPhone: string },
): boolean {
  const pa = normalizeFootballCustomerPhone(a.customerPhone);
  const pb = normalizeFootballCustomerPhone(b.customerPhone);
  if (pa.length >= 9 && pb.length >= 9) {
    if (pa === pb) return true;
    if (pa.endsWith(pb.slice(-9)) || pb.endsWith(pa.slice(-9))) return true;
  } else if (pa.length >= 4 && pb.length >= 4 && pa === pb) {
    return true;
  }
  const na = a.customerName.trim().toLowerCase();
  const nb = b.customerName.trim().toLowerCase();
  return Boolean(na && nb && na === nb);
}

type SessionBooking = {
  id: number;
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  status: string;
};

/** คิวเดียวกัน (สนาม + วัน + ชื่อ/เบอร์) ที่ยังไม่ยกเลิก/เช็กเอาต์ */
export function listFootballTurfSessionBookings<T extends SessionBooking>(
  anchor: T,
  all: T[],
): T[] {
  return all
    .filter(
      (item) =>
        item.status !== "CANCELLED" &&
        item.status !== "COMPLETED" &&
        item.courtId === anchor.courtId &&
        item.bookingDate === anchor.bookingDate &&
        sameFootballTurfCustomer(anchor, item),
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function footballTurfSessionEndMinutes(session: Array<{ endTime: string }>): number {
  if (session.length === 0) return 0;
  return Math.max(...session.map((item) => timeToMinutes(item.endTime)));
}

export function isFootballTurfSameSessionBooking(
  anchor: SessionBooking,
  other: SessionBooking,
): boolean {
  if (other.status === "CANCELLED" || other.status === "COMPLETED") return false;
  return (
    other.courtId === anchor.courtId &&
    other.bookingDate === anchor.bookingDate &&
    sameFootballTurfCustomer(anchor, other)
  );
}

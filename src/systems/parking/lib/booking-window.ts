import { bangkokDateKey } from "@/lib/time/bangkok";

/** การจองที่ควรแสดงบนกริดช่อง — อยู่ในช่วงเวลาจอง หรือจองวันนี้ที่ยังไม่ถึงเวลา */
export function isParkingBookingVisibleOnSpotGrid(
  scheduledStart: Date,
  scheduledEnd: Date | null,
  now = new Date(),
): boolean {
  if (scheduledEnd && scheduledEnd < now) return false;
  const today = bangkokDateKey(now);
  const startDay = bangkokDateKey(scheduledStart);
  if (startDay > today) return false;
  if (startDay < today) {
    return scheduledEnd ? scheduledEnd >= now : false;
  }
  return true;
}

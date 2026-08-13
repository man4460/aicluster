import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDayRangeFromDateKey } from "@/lib/car-wash/booking-datetime";
import { normalizePhone } from "@/lib/car-wash/http";

type Tx = Pick<PrismaClient, "carWashBooking" | "carWashVisit">;

/**
 * ผูก Visit กับคิวจอง — ใช้ bookingId ที่ส่งมา หรือจับคู่เบอร์/ทะเบียนวันนี้
 * (ลิงก์ลูกค้า · เพิ่มคิว · บันทึกรายการ = ชุดข้อมูลเดียวกัน)
 */
export async function resolveAndLinkCarWashVisitBooking(
  db: Tx,
  opts: {
    ownerUserId: string;
    trialSessionId: string;
    visitId: number;
    bookingId?: number | null;
    customerPhone: string;
    plateNumber: string;
    serviceStatus: string;
  },
): Promise<number | null> {
  const phone = normalizePhone(opts.customerPhone);
  const plate = opts.plateNumber.trim().replace(/\s+/g, "").toUpperCase();
  const dateKey = bangkokDateKey();
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) return null;

  let booking =
    opts.bookingId != null && opts.bookingId > 0
      ? await db.carWashBooking.findFirst({
          where: {
            id: opts.bookingId,
            ownerUserId: opts.ownerUserId,
            trialSessionId: opts.trialSessionId,
          },
        })
      : null;

  if (!booking) {
    const or: Array<{ phone?: string; plateNumber?: string }> = [];
    if (phone.length >= 9) or.push({ phone });
    if (plate.length > 0) or.push({ plateNumber: plate });
    if (or.length === 0) return null;

    booking = await db.carWashBooking.findFirst({
      where: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        scheduledAt: { gte: range.start, lt: range.end },
        status: { in: ["SCHEDULED", "ARRIVED", "IN_SERVICE"] },
        OR: or,
        visit: null,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  if (!booking) return null;

  const alreadyLinked = await db.carWashVisit.findFirst({
    where: {
      ownerUserId: opts.ownerUserId,
      trialSessionId: opts.trialSessionId,
      bookingId: booking.id,
      NOT: { id: opts.visitId },
    },
    select: { id: true },
  });
  if (alreadyLinked) return null;

  const nextBookingStatus =
    opts.serviceStatus === "WASHING" ||
    opts.serviceStatus === "VACUUMING" ||
    opts.serviceStatus === "WAXING" ||
    opts.serviceStatus === "IN_PROGRESS"
      ? ("IN_SERVICE" as const)
      : opts.serviceStatus === "COMPLETED" ||
          opts.serviceStatus === "PAID" ||
          opts.serviceStatus === "HANDED_OVER"
        ? ("COMPLETED" as const)
        : ("ARRIVED" as const);

  await db.carWashVisit.update({
    where: { id: opts.visitId },
    data: {
      bookingId: booking.id,
      visitAt: booking.scheduledAt,
    },
  });

  if (
    booking.status === "SCHEDULED" ||
    (booking.status === "ARRIVED" && nextBookingStatus !== "ARRIVED") ||
    (booking.status === "IN_SERVICE" && nextBookingStatus === "COMPLETED")
  ) {
    await db.carWashBooking.update({
      where: { id: booking.id },
      data: { status: nextBookingStatus },
    });
  }

  return booking.id;
}

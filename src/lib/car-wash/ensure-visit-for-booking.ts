import type { CarWashBooking, CarWashPackage, PrismaClient } from "@/generated/prisma/client";
import type { CarWashBookingStatus } from "@/generated/prisma/enums";

/**
 * เมื่อคิวจองเปลี่ยนเป็น ARRIVED / IN_SERVICE — สร้างหรือผูก CarWashVisit
 * ให้ลานล้างกับจัดการคิวเป็นข้อมูลชุดเดียวกัน (ตามเวลาจอง)
 */
export async function ensureCarWashVisitForBooking(
  db: PrismaClient,
  booking: CarWashBooking,
  opts?: { recordedByName?: string; forceStatus?: "QUEUED" | "WASHING" },
): Promise<{ visitId: number; created: boolean }> {
  const existing = await db.carWashVisit.findFirst({
    where: {
      ownerUserId: booking.ownerUserId,
      trialSessionId: booking.trialSessionId,
      bookingId: booking.id,
    },
    select: { id: true },
  });
  if (existing) {
    return { visitId: existing.id, created: false };
  }

  let pkg: CarWashPackage | null = null;
  if (booking.packageId != null) {
    pkg = await db.carWashPackage.findFirst({
      where: {
        id: booking.packageId,
        ownerUserId: booking.ownerUserId,
        trialSessionId: booking.trialSessionId,
      },
    });
  }

  const serviceStatus = opts?.forceStatus ?? "QUEUED";
  const price = pkg?.price ?? 0;
  const row = await db.carWashVisit.create({
    data: {
      ownerUserId: booking.ownerUserId,
      trialSessionId: booking.trialSessionId,
      visitAt: booking.scheduledAt,
      customerName: booking.customerName?.trim() || booking.plateNumber || booking.phone,
      customerPhone: booking.phone,
      plateNumber: booking.plateNumber || "",
      packageId: booking.packageId,
      packageName: booking.packageName || pkg?.name || "บริการคาร์แคร์",
      listedPrice: price,
      finalPrice: price,
      note: booking.note?.trim() || `จากคิวจอง #${booking.id}`,
      recordedByName: opts?.recordedByName?.trim() || "ระบบคิว",
      serviceStatus,
      photoUrl: "",
      bookingId: booking.id,
    },
    select: { id: true },
  });
  return { visitId: row.id, created: true };
}

export function bookingStatusShouldEnsureVisit(status: CarWashBookingStatus): boolean {
  return status === "ARRIVED" || status === "IN_SERVICE";
}

export function visitStatusForBookingStatus(
  status: CarWashBookingStatus,
): "QUEUED" | "WASHING" | null {
  if (status === "ARRIVED") return "QUEUED";
  if (status === "IN_SERVICE") return "WASHING";
  return null;
}

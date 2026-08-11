import type { PrismaClient } from "@/generated/prisma/client";
import { createCarWashBookingWithPayment } from "@/lib/car-wash/create-booking";

export type PortalCreateBookingInput = {
  phone: string;
  plateNumber?: string | null;
  scheduledAtLocal: string;
  packageId: number;
  customerName?: string | null;
  paymentMethod?: string | null;
  amountPaidBaht?: number | null;
  paymentSlipUrl?: string | null;
};

export async function createCarWashBookingForPortal(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  input: PortalCreateBookingInput,
): Promise<
  | {
      ok: true;
      booking: { id: number; scheduledAt: string; timeLabel: string; dateLabel: string };
    }
  | { ok: false; error: string }
> {
  const result = await createCarWashBookingWithPayment(db, ownerUserId, trialSessionId, {
    phone: input.phone,
    plateNumber: input.plateNumber,
    scheduledAtLocal: input.scheduledAtLocal,
    packageId: input.packageId,
    customerName: input.customerName,
    fromPortal: true,
    payment: {
      paymentMethod: input.paymentMethod,
      amountPaidBaht: input.amountPaidBaht,
      paymentSlipUrl: input.paymentSlipUrl,
    },
  });
  if (!result.ok) return result;
  return {
    ok: true,
    booking: {
      id: result.booking.id,
      scheduledAt: result.booking.scheduledAt.toISOString(),
      dateLabel: result.booking.dateKey,
      timeLabel: result.booking.time,
    },
  };
}

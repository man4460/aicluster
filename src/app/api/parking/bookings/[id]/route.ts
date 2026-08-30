import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { isAppPaymentMethod } from "@/components/app-templates/payment-method";
import { applyParkingLoyaltyEarnOnPaid } from "@/systems/parking/lib/loyalty";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  spot_id: z.number().int().positive().optional().nullable(),
  note: z.string().max(255).optional().nullable(),
  payment_method: z.string().max(24).optional().nullable(),
  payment_slip_url: z.string().max(512).optional().nullable(),
  deposit_slip_url: z.string().max(512).optional().nullable(),
  amount_paid_baht: z.number().int().min(0).max(9_999_999).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const existing = await prisma.parkingBooking.findFirst({
    where: { id, ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    include: { site: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  /** เข้าเช็คอินจากจอง — สร้างเซสชันถ้ายังไม่มี */
  if (parsed.data.status === "CHECKED_IN" && existing.status === "SCHEDULED") {
    const spotId = parsed.data.spot_id ?? existing.spotId;
    if (!spotId) {
      return NextResponse.json({ error: "เลือกช่องจอดก่อนเช็คอิน" }, { status: 400 });
    }
    const spot = await prisma.parkingSpot.findFirst({
      where: { id: spotId, siteId: existing.siteId },
      include: { site: true },
    });
    if (!spot) return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });

    const occupied = await prisma.parkingSession.findFirst({
      where: { spotId, status: "ACTIVE" },
    });
    if (occupied) return NextResponse.json({ error: "ช่องนี้มีรถจอดอยู่แล้ว" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.parkingSession.create({
        data: {
          spotId,
          checkInAt: new Date(),
          licensePlate: existing.licensePlate,
          customerName: existing.customerName,
          customerPhone: existing.customerPhone,
          selfCheckIn: false,
          pricingMode: existing.pricingMode,
          hourlyRateSnap: spot.site.hourlyRateBaht,
          dailyRateSnap: spot.site.dailyRateBaht,
          monthlyRateSnap: spot.site.monthlyRateBaht,
          packageId: existing.packageId,
          packageName: existing.packageName || null,
          bookingId: existing.id,
          amountPaidBaht: existing.amountPaidBaht,
          paymentMethod: existing.paymentMethod,
          paymentSlipUrl: existing.paymentSlipUrl ?? existing.depositSlipUrl,
          memberPhone: existing.customerPhone?.replace(/\D/g, "").slice(0, 20) || null,
        },
      });
      const booking = await tx.parkingBooking.update({
        where: { id },
        data: {
          status: "CHECKED_IN",
          spotId,
          ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
        },
        include: { site: { select: { name: true } } },
      });
      return { session, booking };
    });
    await applyParkingLoyaltyEarnOnPaid({
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
      sessionId: result.session.id,
      amountPaidBaht: result.booking.amountPaidBaht,
      memberPhone: result.booking.customerPhone ?? "",
      customerName: result.booking.customerName,
    });

    return NextResponse.json({
      booking: {
        id: result.booking.id,
        site_id: result.booking.siteId,
        site_name: result.booking.site.name,
        spot_id: result.booking.spotId,
        license_plate: result.booking.licensePlate,
        customer_name: result.booking.customerName,
        customer_phone: result.booking.customerPhone,
        package_id: result.booking.packageId,
        package_name: result.booking.packageName,
        scheduled_start: result.booking.scheduledStart.toISOString(),
        scheduled_end: result.booking.scheduledEnd?.toISOString() ?? null,
        pricing_mode: result.booking.pricingMode,
        amount_baht: result.booking.amountBaht,
        amount_paid_baht: result.booking.amountPaidBaht,
        payment_status: result.booking.paymentStatus,
        payment_method: result.booking.paymentMethod,
        payment_slip_url: result.booking.paymentSlipUrl,
        deposit_slip_url: result.booking.depositSlipUrl,
        deposit_amount_baht: result.booking.depositAmountBaht,
        status: result.booking.status,
        note: result.booking.note,
      },
      session_id: result.session.id,
    });
  }

  const row = await prisma.parkingBooking.update({
    where: { id },
    data: {
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
      ...(parsed.data.spot_id !== undefined ? { spotId: parsed.data.spot_id } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
      ...(parsed.data.payment_method !== undefined
        ? { paymentMethod: isAppPaymentMethod(parsed.data.payment_method) ? parsed.data.payment_method : null }
        : {}),
      ...(parsed.data.payment_slip_url !== undefined ? { paymentSlipUrl: parsed.data.payment_slip_url?.trim() || null } : {}),
      ...(parsed.data.deposit_slip_url !== undefined ? { depositSlipUrl: parsed.data.deposit_slip_url?.trim() || null } : {}),
      ...(parsed.data.amount_paid_baht !== undefined
        ? {
            amountPaidBaht: Math.min(existing.amountBaht, parsed.data.amount_paid_baht),
            paymentStatus:
              parsed.data.amount_paid_baht >= existing.amountBaht && existing.amountBaht > 0
                ? "PAID"
                : parsed.data.amount_paid_baht > 0
                  ? "PARTIAL"
                  : "UNPAID",
          }
        : {}),
    },
    include: { site: { select: { name: true } } },
  });

  return NextResponse.json({
    booking: {
      id: row.id,
      site_id: row.siteId,
      site_name: row.site.name,
      spot_id: row.spotId,
      license_plate: row.licensePlate,
      customer_name: row.customerName,
      customer_phone: row.customerPhone,
      package_id: row.packageId,
      package_name: row.packageName,
      scheduled_start: row.scheduledStart.toISOString(),
      scheduled_end: row.scheduledEnd?.toISOString() ?? null,
      pricing_mode: row.pricingMode,
      amount_baht: row.amountBaht,
      amount_paid_baht: row.amountPaidBaht,
      payment_status: row.paymentStatus,
      payment_method: row.paymentMethod,
      payment_slip_url: row.paymentSlipUrl,
      deposit_slip_url: row.depositSlipUrl,
      deposit_amount_baht: row.depositAmountBaht,
      status: row.status,
      note: row.note,
    },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const existing = await prisma.parkingBooking.findFirst({
    where: { id, ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  await prisma.parkingBooking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

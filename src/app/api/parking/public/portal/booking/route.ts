import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { parkingPortalDays } from "@/systems/parking/lib/portal-booking";
import { bangkokDateKey } from "@/lib/time/bangkok";

const statusLabels: Record<string, string> = {
  SCHEDULED: "รอเข้าจอด",
  CHECKED_IN: "เข้าจอดแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มาตามนัด",
};

const paymentStatusLabels: Record<string, string> = {
  PAID: "ชำระครบ",
  PARTIAL: "ชำระบางส่วน",
  UNPAID: "ยังไม่ชำระ",
};

const paymentMethodLabels: Record<string, string> = {
  PROMPTPAY: "พร้อมเพย์",
  TRANSFER: "โอนเงิน",
  CASH: "เงินสด",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const bookingId = Number(url.searchParams.get("bookingId"));
  const phone = (url.searchParams.get("phone") ?? "").replace(/\D/g, "");
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId || !Number.isInteger(bookingId) || phone.length < 4) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const booking = await prisma.parkingBooking.findFirst({
    where: { id: bookingId, ownerUserId: ownerId, trialSessionId },
    include: { site: true },
  });
  if (!booking) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
  const stored = (booking.customerPhone ?? "").replace(/\D/g, "");
  if (!(stored === phone || stored.endsWith(phone) || phone.endsWith(stored.slice(-9)))) {
    return NextResponse.json({ error: "เบอร์โทรไม่ตรงกับการจอง" }, { status: 403 });
  }
  const spot = booking.spotId
    ? await prisma.parkingSpot.findFirst({
        where: { id: booking.spotId },
        select: { spotCode: true, zoneLabel: true, sortFloor: true },
      })
    : null;

  const startYmd = bangkokDateKey(booking.scheduledStart);
  const endYmd = booking.scheduledEnd ? bangkokDateKey(booking.scheduledEnd) : startYmd;
  const days = booking.scheduledEnd ? parkingPortalDays(startYmd, endYmd) : 1;
  const payStatus = (booking.paymentStatus || "UNPAID").toUpperCase();
  const payMethod = (booking.paymentMethod || "").toUpperCase();

  return NextResponse.json({
    property: {
      name: booking.site.name,
      logoUrl: booking.site.logoUrl,
      contactPhone: booking.site.contactPhone,
      address: booking.site.address,
      lineId: booking.site.lineId,
    },
    booking: {
      id: booking.id,
      licensePlate: booking.licensePlate,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      siteName: booking.site.name,
      spotCode: spot?.spotCode ?? null,
      zoneLabel: spot?.zoneLabel ?? null,
      sortFloor: spot?.sortFloor ?? null,
      scheduledStart: booking.scheduledStart.toISOString(),
      scheduledEnd: booking.scheduledEnd?.toISOString() ?? null,
      days,
      status: booking.status,
      statusLabel: statusLabels[booking.status] ?? booking.status,
      totalBaht: booking.amountBaht,
      amountPaidBaht: booking.amountPaidBaht,
      remainingBaht: Math.max(0, booking.amountBaht - booking.amountPaidBaht),
      depositAmountBaht: booking.depositAmountBaht,
      paymentStatus: payStatus,
      paymentStatusLabel: paymentStatusLabels[payStatus] ?? payStatus,
      paymentMethod: payMethod || null,
      paymentMethodLabel: payMethod ? paymentMethodLabels[payMethod] ?? payMethod : null,
      paymentSlipUrl: booking.paymentSlipUrl,
      depositSlipUrl: booking.depositSlipUrl,
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { assertOwnerPlanUpload } from "@/lib/modules/plan-entitlements";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  normalizeParkingPortalPaymentMode,
  parkingIsPortalSpotAvailable,
  parkingPortalDate,
  parkingPortalDays,
  parkingPortalPayDueBaht,
} from "@/systems/parking/lib/portal-booking";

const schema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  trialSessionId: z.string().trim().max(36).optional(),
  siteId: z.number().int().positive(),
  spotId: z.number().int().positive(),
  licensePlate: z.string().trim().min(1).max(24),
  customerName: z.string().trim().min(1).max(100),
  customerPhone: z.string().trim().min(9).max(32),
  startYmd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endYmd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(["PROMPTPAY", "TRANSFER"]).optional(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
  amountPaidBaht: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`parking-portal-book:${clientIp(req.headers)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ส่งคำขอถี่เกินไป" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;
  const trialSessionId = d.trialSessionId || TRIAL_PROD_SCOPE;
  const phone = d.customerPhone.replace(/\D/g, "").slice(0, 20);
  const days = parkingPortalDays(d.startYmd, d.endYmd);
  const start = parkingPortalDate(d.startYmd);
  const end = parkingPortalDate(d.endYmd);
  if (phone.length < 9 || !start || !end || days < 1) {
    return NextResponse.json({ error: "เบอร์โทรหรือช่วงวันที่ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!(await isParkingPortalOpenForOwner(d.ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }

  const spot = await prisma.parkingSpot.findFirst({
    where: {
      id: d.spotId,
      siteId: d.siteId,
      site: {
        ownerUserId: d.ownerId,
        trialSessionId,
        isActive: true,
        dailyRateBaht: { not: null },
      },
    },
    include: {
      site: true,
    },
  });
  if (!spot || spot.site.dailyRateBaht == null) {
    return NextResponse.json({ error: "ไม่พบช่องจอดที่เลือก" }, { status: 404 });
  }

  const available = await parkingIsPortalSpotAvailable(
    prisma,
    d.ownerId,
    trialSessionId,
    spot.id,
    start,
    end,
  );
  if (!available) {
    return NextResponse.json({ error: "ช่องจอดไม่ว่างในช่วงนี้แล้ว" }, { status: 409 });
  }

  const amountBaht = Math.round(Number(spot.site.dailyRateBaht) * days);
  const mode = normalizeParkingPortalPaymentMode(spot.site.bookingPaymentMode);
  const payDue = parkingPortalPayDueBaht(amountBaht, mode, spot.site.depositPercent);
  const slip = d.paymentSlipUrl?.trim() || null;
  if (payDue > 0 && !slip) {
    return NextResponse.json(
      {
        error:
          mode === "DEPOSIT"
            ? "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง"
            : "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง",
      },
      { status: 400 },
    );
  }
  if (payDue > 0) {
    const gate = await assertOwnerPlanUpload(d.ownerId, "slip", PARKING_MODULE_SLUG);
    if (!gate.ok) return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
  }
  const paid = slip ? payDue : 0;
  const booking = await prisma.parkingBooking.create({
    data: {
      ownerUserId: d.ownerId,
      trialSessionId,
      siteId: spot.siteId,
      spotId: spot.id,
      licensePlate: d.licensePlate.replace(/\s+/g, ""),
      customerName: d.customerName,
      customerPhone: phone,
      scheduledStart: start,
      scheduledEnd: end,
      pricingMode: "DAILY",
      amountBaht,
      amountPaidBaht: paid,
      depositAmountBaht: mode === "DEPOSIT" ? payDue : 0,
      paymentMethod: payDue > 0 ? (d.paymentMethod ?? "PROMPTPAY") : null,
      // สลิปตอนจองผ่านพอร์ทัล → deposit (เหมือนโรงแรม) ให้หน้ารายละเอียดแสดง «ชำระตอนจอง»
      paymentSlipUrl: null,
      depositSlipUrl: slip,
      paymentStatus: paid >= amountBaht && amountBaht > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      status: "SCHEDULED",
    },
  });
  return NextResponse.json({ booking: { id: booking.id, customerPhone: phone } }, { status: 201 });
}

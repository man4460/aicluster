import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAppPaymentMethod } from "@/components/app-templates/payment-method";
import { applyParkingLoyaltyEarnOnPaid, ensureParkingLoyaltyMember } from "@/systems/parking/lib/loyalty";
import { normalizeParkingMemberPhone } from "@/systems/parking/lib/loyalty-rule";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const licensePlate =
    typeof body?.licensePlate === "string" ? body.licensePlate.trim().replace(/\s+/g, "") : "";
  if (!token || token.length > 64 || !licensePlate || licensePlate.length > 24) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบหรือไม่ถูกต้อง" }, { status: 400 });
  }

  const spot = await prisma.parkingSpot.findUnique({
    where: { checkInToken: token },
    include: { site: true },
  });
  if (!spot) {
    return NextResponse.json({ error: "ลิงก์ไม่ถูกต้องหรือหมดอายุ" }, { status: 404 });
  }

  const existing = await prisma.parkingSession.findFirst({
    where: { spotId: spot.id, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "ช่องจอดนี้มีผู้ใช้บริการอยู่แล้ว" }, { status: 409 });
  }

  const site = spot.site;
  const customerName =
    typeof body?.customerName === "string" && body.customerName.trim()
      ? body.customerName.trim().slice(0, 100)
      : null;
  const customerPhone =
    typeof body?.customerPhone === "string" && body.customerPhone.trim()
      ? body.customerPhone.trim().slice(0, 32)
      : null;
  const shuttleFrom =
    typeof body?.shuttleFrom === "string" && body.shuttleFrom.trim()
      ? body.shuttleFrom.trim().slice(0, 255)
      : null;
  const shuttleTo =
    typeof body?.shuttleTo === "string" && body.shuttleTo.trim()
      ? body.shuttleTo.trim().slice(0, 255)
      : null;
  const shuttleNote =
    typeof body?.shuttleNote === "string" && body.shuttleNote.trim() ? body.shuttleNote.trim() : null;
  const memberPhone = normalizeParkingMemberPhone(customerPhone ?? "");
  const paymentMethodRaw = typeof body?.paymentMethod === "string" ? body.paymentMethod : null;
  const paymentMethod = isAppPaymentMethod(paymentMethodRaw) ? paymentMethodRaw : null;
  const paymentSlipUrl =
    typeof body?.paymentSlipUrl === "string" && body.paymentSlipUrl.trim()
      ? body.paymentSlipUrl.trim().slice(0, 512)
      : null;
  const paidCandidate = Number(body?.amountPaidBaht ?? 0);
  const amountPaidBaht = Number.isFinite(paidCandidate) && paidCandidate >= 0 ? paidCandidate : 0;

  if (memberPhone.length >= 9) {
    await ensureParkingLoyaltyMember({
      ownerUserId: site.ownerUserId,
      trialSessionId: site.trialSessionId,
      phone: memberPhone,
      customerName,
    });
  }

  const session = await prisma.parkingSession.create({
    data: {
      spotId: spot.id,
      checkInAt: new Date(),
      licensePlate,
      customerName,
      customerPhone,
      selfCheckIn: true,
      pricingMode: site.pricingMode,
      hourlyRateSnap: site.hourlyRateBaht,
      dailyRateSnap: site.dailyRateBaht,
      monthlyRateSnap: site.monthlyRateBaht,
      shuttleFrom,
      shuttleTo,
      shuttleNote,
      memberPhone: memberPhone || null,
      paymentMethod,
      paymentSlipUrl,
      amountPaidBaht,
      amountDueBaht: amountPaidBaht > 0 ? amountPaidBaht : null,
    },
  });

  const pointsEarned = await applyParkingLoyaltyEarnOnPaid({
    ownerUserId: site.ownerUserId,
    trialSessionId: site.trialSessionId,
    sessionId: session.id,
    amountPaidBaht,
    memberPhone,
    customerName,
  });

  return NextResponse.json({
    ok: true,
    spotCode: spot.spotCode,
    sessionId: session.id,
    checkInAt: session.checkInAt.toISOString(),
    pricingMode: site.pricingMode,
    amountPaidBaht,
    pointsEarned,
  });
}

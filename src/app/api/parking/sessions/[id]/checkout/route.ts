import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { computeSessionAmount } from "@/systems/parking/lib/parking-math";
import { isAppPaymentMethod } from "@/components/app-templates/payment-method";
import { applyParkingLoyaltyEarnOnPaid } from "@/systems/parking/lib/loyalty";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const id = Number((await params).id);
  const row = await prisma.parkingSession.findFirst({
    where: {
      id,
      status: "ACTIVE",
      spot: { site: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId } },
    },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบรายการที่กำลังจอด" }, { status: 404 });
  const result = computeSessionAmount(
    row.pricingMode,
    row.checkInAt,
    new Date(),
    row.hourlyRateSnap != null ? Number(row.hourlyRateSnap) : null,
    row.dailyRateSnap != null ? Number(row.dailyRateSnap) : null,
    row.monthlyRateSnap != null ? Number(row.monthlyRateSnap) : null,
  );
  const paid = row.amountPaidBaht != null ? Number(row.amountPaidBaht) : 0;
  return NextResponse.json({ amountDueBaht: result.amount, amountPaidBaht: paid, payNowBaht: Math.max(0, result.amount - paid) });
}

export async function POST(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const amountPaidRaw = body.amountPaidBaht;
  const amountPaidBaht =
    amountPaidRaw === undefined || amountPaidRaw === null
      ? null
      : typeof amountPaidRaw === "number"
        ? amountPaidRaw
        : Number(amountPaidRaw);
  const paymentMethodRaw = typeof body.paymentMethod === "string" ? body.paymentMethod : null;
  const paymentMethod = isAppPaymentMethod(paymentMethodRaw) ? paymentMethodRaw : null;
  const paymentSlipUrl =
    typeof body.paymentSlipUrl === "string" && body.paymentSlipUrl.trim()
      ? body.paymentSlipUrl.trim().slice(0, 512)
      : null;

  const row = await prisma.parkingSession.findFirst({
    where: {
      id,
      status: "ACTIVE",
      spot: { site: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId } },
    },
  });
  if (!row) {
    return NextResponse.json({ error: "ไม่พบรายการที่กำลังจอด" }, { status: 404 });
  }

  const checkOutAt = new Date();
  const { units, amount } = computeSessionAmount(
    row.pricingMode,
    row.checkInAt,
    checkOutAt,
    row.hourlyRateSnap != null ? Number(row.hourlyRateSnap) : null,
    row.dailyRateSnap != null ? Number(row.dailyRateSnap) : null,
    row.monthlyRateSnap != null ? Number(row.monthlyRateSnap) : null,
  );

  const previouslyPaid = row.amountPaidBaht != null ? Number(row.amountPaidBaht) : 0;
  const payNow =
    amountPaidBaht != null && Number.isFinite(amountPaidBaht) && amountPaidBaht >= 0
      ? amountPaidBaht
      : Math.max(0, amount - previouslyPaid);
  const paid = previouslyPaid + payNow;

  const updated = await prisma.parkingSession.update({
    where: { id },
    data: {
      status: "COMPLETED",
      checkOutAt,
      billedUnits: units,
      amountDueBaht: amount,
      amountPaidBaht: paid,
      paymentMethod: paymentMethod ?? row.paymentMethod,
      paymentSlipUrl: paymentSlipUrl ?? row.paymentSlipUrl,
    },
  });

  const pointsEarned = await applyParkingLoyaltyEarnOnPaid({
    ownerUserId: ctx.ownerUserId,
    trialSessionId: ctx.trialSessionId,
    sessionId: updated.id,
    amountPaidBaht: paid,
    memberPhone: updated.memberPhone ?? updated.customerPhone ?? "",
    customerName: updated.customerName,
  });

  return NextResponse.json({
    session: {
      id: updated.id,
      checkOutAt: updated.checkOutAt!.toISOString(),
      billedUnits: updated.billedUnits,
      amountDueBaht: updated.amountDueBaht != null ? Number(updated.amountDueBaht) : null,
      amountPaidBaht: updated.amountPaidBaht != null ? Number(updated.amountPaidBaht) : null,
      paymentMethod: updated.paymentMethod,
      paymentSlipUrl: updated.paymentSlipUrl,
      pointsEarned,
      licensePlate: updated.licensePlate,
    },
  });
}

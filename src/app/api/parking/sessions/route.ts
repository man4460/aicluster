import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { isAppPaymentMethod } from "@/components/app-templates/payment-method";
import { applyParkingLoyaltyEarnOnPaid, ensureParkingLoyaltyMember } from "@/systems/parking/lib/loyalty";
import { normalizeParkingMemberPhone } from "@/systems/parking/lib/loyalty-rule";
import { computeSessionAmount } from "@/systems/parking/lib/parking-math";

export async function GET(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = url.searchParams.get("status") ?? "ALL";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const checkInRange: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) checkInRange.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) checkInRange.lte = d;
  }

  const where: Prisma.ParkingSessionWhereInput = {
    spot: { site: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId } },
    ...(q ? { licensePlate: { contains: q.replace(/\s+/g, "") } } : {}),
    ...(status === "ACTIVE" || status === "COMPLETED" || status === "CANCELLED" ? { status } : {}),
    ...(Object.keys(checkInRange).length > 0 ? { checkInAt: checkInRange } : {}),
  };

  const sessions = await prisma.parkingSession.findMany({
    where,
    orderBy: { checkInAt: "desc" },
    take: 200,
    include: {
      spot: { select: { spotCode: true, zoneLabel: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      status: s.status,
      checkInAt: s.checkInAt.toISOString(),
      checkOutAt: s.checkOutAt?.toISOString() ?? null,
      licensePlate: s.licensePlate,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      selfCheckIn: s.selfCheckIn,
      pricingMode: s.pricingMode,
      billedUnits: s.billedUnits,
      amountDueBaht: s.amountDueBaht != null ? Number(s.amountDueBaht) : null,
      amountPaidBaht: s.amountPaidBaht != null ? Number(s.amountPaidBaht) : null,
      currentAmountDueBaht:
        s.status === "ACTIVE"
          ? computeSessionAmount(
              s.pricingMode,
              s.checkInAt,
              new Date(),
              s.hourlyRateSnap == null ? null : Number(s.hourlyRateSnap),
              s.dailyRateSnap == null ? null : Number(s.dailyRateSnap),
              s.monthlyRateSnap == null ? null : Number(s.monthlyRateSnap),
            ).amount
          : s.amountDueBaht == null ? null : Number(s.amountDueBaht),
      shuttleFrom: s.shuttleFrom,
      shuttleTo: s.shuttleTo,
      shuttleNote: s.shuttleNote,
      spotCode: s.spot.spotCode,
      zoneLabel: s.spot.zoneLabel,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const spotId = typeof body?.spotId === "number" ? body.spotId : Number(body?.spotId);
  const licensePlate =
    typeof body?.licensePlate === "string" ? body.licensePlate.trim().replace(/\s+/g, "") : "";
  if (!Number.isInteger(spotId) || spotId < 1 || !licensePlate || licensePlate.length > 24) {
    return NextResponse.json({ error: "ระบุช่องจอดและทะเบียนรถ" }, { status: 400 });
  }

  const spot = await prisma.parkingSpot.findFirst({
    where: {
      id: spotId,
      site: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    },
    include: { site: true },
  });
  if (!spot) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }

  const existing = await prisma.parkingSession.findFirst({
    where: { spotId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "ช่องนี้มีรถจอดอยู่แล้ว" }, { status: 400 });
  }

  const site = spot.site;
  const membershipIdRaw = body?.membershipId;
  const membershipId =
    typeof membershipIdRaw === "number"
      ? membershipIdRaw
      : typeof membershipIdRaw === "string"
        ? Number(membershipIdRaw)
        : null;
  let membershipSnap: { id: number; packageName: string; packageId: number } | null = null;
  if (membershipId != null && Number.isInteger(membershipId) && membershipId > 0) {
    const m = await prisma.parkingMembership.findFirst({
      where: {
        id: membershipId,
        ownerUserId: ctx.ownerUserId,
        trialSessionId: ctx.trialSessionId,
        isActive: true,
      },
    });
    if (!m || m.usedUses >= m.totalUses) {
      return NextResponse.json({ error: "สมาชิก/เหมาไม่พร้อมใช้งาน หรือสิทธิ์หมดแล้ว" }, { status: 400 });
    }
    membershipSnap = { id: m.id, packageName: m.packageName, packageId: m.packageId };
  }

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
  const internalNote =
    typeof body?.internalNote === "string" && body.internalNote.trim() ? body.internalNote.trim() : null;
  const memberPhone = normalizeParkingMemberPhone(customerPhone ?? "");
  const paymentMethodRaw = typeof body?.paymentMethod === "string" ? body.paymentMethod : null;
  const paymentMethod = isAppPaymentMethod(paymentMethodRaw) ? paymentMethodRaw : null;
  const paymentSlipUrl =
    typeof body?.paymentSlipUrl === "string" && body.paymentSlipUrl.trim()
      ? body.paymentSlipUrl.trim().slice(0, 512)
      : null;
  const amountPaidCandidate = Number(body?.amountPaidBaht ?? 0);
  const amountPaidBaht = Number.isFinite(amountPaidCandidate) && amountPaidCandidate >= 0
    ? Math.round(amountPaidCandidate * 100) / 100
    : 0;

  if (memberPhone.length >= 9) {
    await ensureParkingLoyaltyMember({
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
      phone: memberPhone,
      customerName,
    });
  }

  const session = await prisma.$transaction(async (tx) => {
    if (membershipSnap) {
      const current = await tx.parkingMembership.findUnique({ where: { id: membershipSnap.id } });
      if (!current || !current.isActive || current.usedUses >= current.totalUses) {
        throw new Error("MEMBERSHIP_EXHAUSTED");
      }
      await tx.parkingMembership.update({
        where: { id: membershipSnap.id },
        data: { usedUses: { increment: 1 } },
      });
    }
    return tx.parkingSession.create({
      data: {
        spotId,
        checkInAt: new Date(),
        licensePlate,
        customerName,
        customerPhone,
        selfCheckIn: false,
        pricingMode: site.pricingMode,
        hourlyRateSnap: site.hourlyRateBaht,
        dailyRateSnap: site.dailyRateBaht,
        monthlyRateSnap: site.monthlyRateBaht,
        packageId: membershipSnap?.packageId ?? null,
        packageName: membershipSnap ? `สมาชิก: ${membershipSnap.packageName}` : null,
        membershipId: membershipSnap?.id ?? null,
        shuttleFrom,
        shuttleTo,
        shuttleNote,
        internalNote,
        memberPhone: memberPhone || null,
        paymentMethod,
        paymentSlipUrl,
        amountPaidBaht,
        amountDueBaht: amountPaidBaht > 0 ? amountPaidBaht : null,
      },
    });
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message === "MEMBERSHIP_EXHAUSTED") return null;
    throw e;
  });

  if (!session) {
    return NextResponse.json({ error: "สมาชิก/เหมาสิทธิ์หมดแล้ว" }, { status: 400 });
  }

  const pointsEarned = await applyParkingLoyaltyEarnOnPaid({
    ownerUserId: ctx.ownerUserId,
    trialSessionId: ctx.trialSessionId,
    sessionId: session.id,
    amountPaidBaht,
    memberPhone,
    customerName,
  });

  return NextResponse.json({
    session: {
      id: session.id,
      checkInAt: session.checkInAt.toISOString(),
      licensePlate: session.licensePlate,
      amountPaidBaht,
      paymentMethod,
      pointsEarned,
    },
  });
}

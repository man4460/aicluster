import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { computeSessionAmount } from "@/systems/parking/lib/parking-math";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
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

  const row = await prisma.parkingSession.findFirst({
    where: {
      id,
      status: "ACTIVE",
      spot: { siteId: ctx.site.id },
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
  );

  const paid =
    amountPaidBaht != null && Number.isFinite(amountPaidBaht) && amountPaidBaht >= 0 ? amountPaidBaht : amount;

  const updated = await prisma.parkingSession.update({
    where: { id },
    data: {
      status: "COMPLETED",
      checkOutAt,
      billedUnits: units,
      amountDueBaht: amount,
      amountPaidBaht: paid,
    },
  });

  return NextResponse.json({
    session: {
      id: updated.id,
      checkOutAt: updated.checkOutAt!.toISOString(),
      billedUnits: updated.billedUnits,
      amountDueBaht: updated.amountDueBaht != null ? Number(updated.amountDueBaht) : null,
      amountPaidBaht: updated.amountPaidBaht != null ? Number(updated.amountPaidBaht) : null,
    },
  });
}

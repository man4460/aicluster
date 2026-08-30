import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext, assertSiteOwned } from "@/systems/parking/lib/parking-api-auth";

const postSchema = z.object({
  site_id: z.number().int().positive(),
  spot_id: z.number().int().positive().optional().nullable(),
  license_plate: z.string().min(1).max(24),
  customer_name: z.string().max(100).optional().nullable(),
  customer_phone: z.string().max(32).optional().nullable(),
  package_id: z.number().int().positive().optional().nullable(),
  package_name: z.string().max(160).optional().nullable(),
  scheduled_start: z.string().min(1),
  scheduled_end: z.string().optional().nullable(),
  pricing_mode: z.enum(["HOURLY", "DAILY", "MONTHLY"]).optional(),
  amount_baht: z.number().int().min(0).max(9_999_999).optional(),
  note: z.string().max(255).optional().nullable(),
});

export async function GET(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const rows = await prisma.parkingBooking.findMany({
    where: {
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
      ...(status === "SCHEDULED" ||
      status === "CHECKED_IN" ||
      status === "COMPLETED" ||
      status === "CANCELLED" ||
      status === "NO_SHOW"
        ? { status }
        : {}),
    },
    orderBy: { scheduledStart: "asc" },
    take: 200,
    include: {
      site: { select: { name: true } },
    },
  });

  return NextResponse.json({
    bookings: rows.map((r) => ({
      id: r.id,
      site_id: r.siteId,
      site_name: r.site.name,
      spot_id: r.spotId,
      license_plate: r.licensePlate,
      customer_name: r.customerName,
      customer_phone: r.customerPhone,
      package_id: r.packageId,
      package_name: r.packageName,
      scheduled_start: r.scheduledStart.toISOString(),
      scheduled_end: r.scheduledEnd?.toISOString() ?? null,
      pricing_mode: r.pricingMode,
      amount_baht: r.amountBaht,
      amount_paid_baht: r.amountPaidBaht,
      payment_status: r.paymentStatus,
      status: r.status,
      note: r.note,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const site = await assertSiteOwned(parsed.data.site_id, ctx.ownerUserId, ctx.trialSessionId);
  if (!site) return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });

  const start = new Date(parsed.data.scheduled_start);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "วันเวลาจองไม่ถูกต้อง" }, { status: 400 });
  }
  const end =
    parsed.data.scheduled_end && parsed.data.scheduled_end.trim()
      ? new Date(parsed.data.scheduled_end)
      : null;
  if (end && Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "วันเวลาสิ้นสุดไม่ถูกต้อง" }, { status: 400 });
  }

  if (parsed.data.spot_id) {
    const spot = await prisma.parkingSpot.findFirst({
      where: { id: parsed.data.spot_id, siteId: site.id },
    });
    if (!spot) return NextResponse.json({ error: "ไม่พบช่องจอดในลานนี้" }, { status: 404 });
  }

  const row = await prisma.parkingBooking.create({
    data: {
      ownerUserId: ctx.ownerUserId,
      trialSessionId: ctx.trialSessionId,
      siteId: site.id,
      spotId: parsed.data.spot_id ?? null,
      licensePlate: parsed.data.license_plate.trim().replace(/\s+/g, ""),
      customerName: parsed.data.customer_name?.trim() || null,
      customerPhone: parsed.data.customer_phone?.trim() || null,
      packageId: parsed.data.package_id ?? null,
      packageName: parsed.data.package_name?.trim() ?? "",
      scheduledStart: start,
      scheduledEnd: end,
      pricingMode: parsed.data.pricing_mode ?? site.pricingMode,
      amountBaht: parsed.data.amount_baht ?? 0,
      note: parsed.data.note?.trim() || null,
      status: "SCHEDULED",
    },
    include: { site: { select: { name: true } } },
  });

  return NextResponse.json(
    {
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
        status: row.status,
        note: row.note,
      },
    },
    { status: 201 },
  );
}

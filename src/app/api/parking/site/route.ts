import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

export async function GET() {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const { site } = ctx;
  const [spotCount, activeCount] = await Promise.all([
    prisma.parkingSpot.count({ where: { siteId: site.id } }),
    prisma.parkingSession.count({ where: { spot: { siteId: site.id }, status: "ACTIVE" } }),
  ]);
  return NextResponse.json({
    site: {
      id: site.id,
      name: site.name,
      pricingMode: site.pricingMode,
      hourlyRateBaht: site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null,
      dailyRateBaht: site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null,
    },
    stats: { spotCount, activeSessions: activeCount },
  });
}

export async function PATCH(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const pricingMode = body.pricingMode === "HOURLY" || body.pricingMode === "DAILY" ? body.pricingMode : undefined;
  const hourly =
    body.hourlyRateBaht === null
      ? null
      : typeof body.hourlyRateBaht === "number"
        ? body.hourlyRateBaht
        : typeof body.hourlyRateBaht === "string"
          ? Number(body.hourlyRateBaht)
          : undefined;
  const daily =
    body.dailyRateBaht === null
      ? null
      : typeof body.dailyRateBaht === "number"
        ? body.dailyRateBaht
        : typeof body.dailyRateBaht === "string"
          ? Number(body.dailyRateBaht)
          : undefined;

  const nextMode = pricingMode ?? ctx.site.pricingMode;
  const nextHourly =
    hourly !== undefined ? hourly : ctx.site.hourlyRateBaht != null ? Number(ctx.site.hourlyRateBaht) : null;
  const nextDaily =
    daily !== undefined ? daily : ctx.site.dailyRateBaht != null ? Number(ctx.site.dailyRateBaht) : null;

  if (nextMode === "HOURLY" && (nextHourly == null || !Number.isFinite(nextHourly) || nextHourly <= 0)) {
    return NextResponse.json({ error: "โหมดรายชั่วโมงต้องระบุราคาต่อชั่วโมงมากกว่า 0" }, { status: 400 });
  }
  if (nextMode === "DAILY" && (nextDaily == null || !Number.isFinite(nextDaily) || nextDaily <= 0)) {
    return NextResponse.json({ error: "โหมดรายวันต้องระบุราคาต่อวันมากกว่า 0" }, { status: 400 });
  }

  const updated = await prisma.parkingSite.update({
    where: { id: ctx.site.id },
    data: {
      ...(name && name.length > 0 ? { name: name.slice(0, 120) } : {}),
      ...(pricingMode ? { pricingMode } : {}),
      ...(hourly !== undefined ? { hourlyRateBaht: hourly } : {}),
      ...(daily !== undefined ? { dailyRateBaht: daily } : {}),
    },
  });

  return NextResponse.json({
    site: {
      id: updated.id,
      name: updated.name,
      pricingMode: updated.pricingMode,
      hourlyRateBaht: updated.hourlyRateBaht != null ? Number(updated.hourlyRateBaht) : null,
      dailyRateBaht: updated.dailyRateBaht != null ? Number(updated.dailyRateBaht) : null,
    },
  });
}

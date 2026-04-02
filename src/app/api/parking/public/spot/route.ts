import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  if (!token || token.length > 64) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 400 });
  }
  const spot = await prisma.parkingSpot.findUnique({
    where: { checkInToken: token },
    include: {
      site: { select: { name: true, pricingMode: true, hourlyRateBaht: true, dailyRateBaht: true } },
      sessions: { where: { status: "ACTIVE" }, take: 1 },
    },
  });
  if (!spot) {
    return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 404 });
  }
  const occupied = spot.sessions.length > 0;
  return NextResponse.json({
    spotCode: spot.spotCode,
    zoneLabel: spot.zoneLabel,
    siteName: spot.site.name,
    pricingMode: spot.site.pricingMode,
    hourlyRateBaht: spot.site.hourlyRateBaht != null ? Number(spot.site.hourlyRateBaht) : null,
    dailyRateBaht: spot.site.dailyRateBaht != null ? Number(spot.site.dailyRateBaht) : null,
    occupied,
  });
}

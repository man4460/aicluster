import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { parkingPortalDays } from "@/systems/parking/lib/portal-booking";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  const startYmd = url.searchParams.get("startYmd") ?? "";
  const endYmd = url.searchParams.get("endYmd") ?? "";
  const days = parkingPortalDays(startYmd, endYmd);
  if (!ownerId || days < 1) return NextResponse.json({ error: "ช่วงวันที่ไม่ถูกต้อง" }, { status: 400 });
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const lots = await prisma.parkingSite.findMany({
    where: { ownerUserId: ownerId, trialSessionId, isActive: true, dailyRateBaht: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, dailyRateBaht: true },
  });
  return NextResponse.json({
    days,
    lots: lots.map((lot) => ({
      id: lot.id,
      name: lot.name,
      dailyRateBaht: Number(lot.dailyRateBaht ?? 0),
      totalBaht: Math.round(Number(lot.dailyRateBaht ?? 0) * days),
    })),
  });
}

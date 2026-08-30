import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  parkingListAvailablePortalSpots,
  parkingPortalDate,
  parkingPortalDays,
} from "@/systems/parking/lib/portal-booking";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  const startYmd = url.searchParams.get("startYmd") ?? "";
  const endYmd = url.searchParams.get("endYmd") ?? "";
  const siteIdRaw = url.searchParams.get("siteId");
  const siteId = siteIdRaw ? Number(siteIdRaw) : undefined;
  const days = parkingPortalDays(startYmd, endYmd);
  const start = parkingPortalDate(startYmd);
  const end = parkingPortalDate(endYmd);

  if (!ownerId || !start || !end || days < 1) {
    return NextResponse.json({ error: "ช่วงวันที่ไม่ถูกต้อง" }, { status: 400 });
  }
  if (siteIdRaw && (!Number.isInteger(siteId) || (siteId ?? 0) < 1)) {
    return NextResponse.json({ error: "ลานจอดไม่ถูกต้อง" }, { status: 400 });
  }
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }

  const spots = await parkingListAvailablePortalSpots(
    prisma,
    ownerId,
    trialSessionId,
    start,
    end,
    { siteId: Number.isInteger(siteId) ? siteId : undefined },
  );

  return NextResponse.json({
    startYmd,
    endYmd,
    days,
    spots,
  });
}

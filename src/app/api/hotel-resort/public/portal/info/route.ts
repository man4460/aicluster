import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export async function GET(req: Request) {
  const ownerId = new URL(req.url).searchParams.get("ownerId")?.trim();
  const trialSessionId = new URL(req.url).searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const profile = await prisma.hotelResortProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    select: { propertyName: true, checkInTime: true, checkOutTime: true },
  });

  return NextResponse.json({
    propertyName: profile?.propertyName ?? "โรงแรม",
    checkInTime: profile?.checkInTime ?? "14:00",
    checkOutTime: profile?.checkOutTime ?? "12:00",
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

async function lookup(ownerId: string, phone: string, trialSessionId: string) {
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const bookings = await prisma.parkingBooking.findMany({
    where: {
      ownerUserId: ownerId,
      trialSessionId,
      customerPhone: { contains: phone.slice(-10) },
      status: { not: "CANCELLED" },
    },
    include: { site: { select: { name: true } } },
    orderBy: { scheduledStart: "desc" },
    take: 20,
  });
  const spotIds = bookings.map((b) => b.spotId).filter((id): id is number => id != null);
  const spots = spotIds.length
    ? await prisma.parkingSpot.findMany({
        where: { id: { in: spotIds } },
        select: { id: true, spotCode: true },
      })
    : [];
  const spotCodeById = new Map(spots.map((s) => [s.id, s.spotCode]));
  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      licensePlate: b.licensePlate,
      siteName: b.site.name,
      spotCode: b.spotId != null ? spotCodeById.get(b.spotId) ?? null : null,
      scheduledStart: b.scheduledStart.toISOString(),
      scheduledEnd: b.scheduledEnd?.toISOString() ?? null,
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalBaht: b.amountBaht,
      amountPaidBaht: b.amountPaidBaht,
    })),
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const phone = (url.searchParams.get("phone") ?? "").replace(/\D/g, "");
  const trial = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId || phone.length < 4) return NextResponse.json({ error: "กรอกเบอร์โทร" }, { status: 400 });
  return lookup(ownerId, phone, trial);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as
    | { ownerId?: string; phone?: string; trialSessionId?: string }
    | null;
  const ownerId = body?.ownerId?.trim() ?? "";
  const phone = (body?.phone ?? "").replace(/\D/g, "");
  const trial = body?.trialSessionId?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId || phone.length < 4) return NextResponse.json({ error: "กรอกเบอร์โทร" }, { status: 400 });
  return lookup(ownerId, phone, trial);
}

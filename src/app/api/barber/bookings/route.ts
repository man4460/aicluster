import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDayRangeFromDateKey, parseBangkokLocalToDate } from "@/lib/barber/booking-datetime";

const postSchema = z.object({
  phone: z.string().min(9).max(32),
  barberCustomerId: z.number().int().positive().optional().nullable(),
  customerName: z.string().trim().max(100).optional().nullable(),
  scheduledAtLocal: z.string().min(16).max(32),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function mapBooking(row: {
  id: number;
  phone: string;
  customerName: string | null;
  scheduledAt: Date;
  status: string;
  barberCustomerId: number | null;
}) {
  return {
    id: row.id,
    phone: row.phone,
    customerName: row.customerName,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    barberCustomerId: row.barberCustomerId,
  };
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("date")?.trim() || bangkokDateKey();
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const rows = await prisma.barberBooking.findMany({
    where: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ bookings: rows.map(mapBooking), date: dateKey });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  }

  const scheduledAt = parseBangkokLocalToDate(parsed.data.scheduledAtLocal);
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "วันเวลานัดไม่ถูกต้อง" }, { status: 400 });
  }

  let barberCustomerId: number | null = parsed.data.barberCustomerId ?? null;
  if (barberCustomerId != null) {
    const c = await prisma.barberCustomer.findFirst({
      where: {
        id: barberCustomerId,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        phone,
      },
    });
    if (!c) {
      return NextResponse.json({ error: "ลูกค้าไม่ตรงกับเบอร์" }, { status: 400 });
    }
  } else {
    const existing = await prisma.barberCustomer.findUnique({
      where: {
        ownerUserId_phone_trialSessionId: {
          ownerUserId: own.ownerId,
          phone,
          trialSessionId: scope.trialSessionId,
        },
      },
    });
    if (existing) barberCustomerId = existing.id;
  }

  const name =
    parsed.data.customerName != null && parsed.data.customerName.length > 0
      ? parsed.data.customerName.trim().slice(0, 100)
      : null;

  const row = await prisma.barberBooking.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      phone,
      barberCustomerId,
      customerName: name,
      scheduledAt,
    },
  });

  return NextResponse.json({ booking: mapBooking(row) });
}

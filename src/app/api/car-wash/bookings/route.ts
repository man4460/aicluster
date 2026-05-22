import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { assertBookingSlotAvailable } from "@/lib/car-wash/booking-slot-availability";
import { bangkokDayRangeFromDateKey } from "@/lib/car-wash/booking-datetime";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

const postSchema = z.object({
  phone: z.string().min(9).max(32),
  plateNumber: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v == null ? "" : String(v).trim().replace(/\s+/g, "").slice(0, 64))),
  customerName: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === undefined) return null;
      const t = String(v).trim();
      return t.length > 0 ? t.slice(0, 160) : null;
    }),
  scheduledAtLocal: z.string().min(10).max(40),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function mapBooking(row: {
  id: number;
  phone: string;
  plateNumber: string;
  customerName: string | null;
  scheduledAt: Date;
  status: string;
}) {
  return {
    id: row.id,
    phone: row.phone,
    plateNumber: row.plateNumber,
    customerName: row.customerName,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
  };
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getCarWashDataScope(own.ownerId);
  const dateKey = new URL(req.url).searchParams.get("date")?.trim() || bangkokDateKey();
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const rows = await prisma.carWashBooking.findMany({
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
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getCarWashDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  }

  const slotCheck = await assertBookingSlotAvailable(
    prisma,
    own.ownerId,
    scope.trialSessionId,
    parsed.data.scheduledAtLocal,
  );
  if (!slotCheck.ok) {
    return NextResponse.json({ error: slotCheck.error }, { status: 400 });
  }
  const { scheduledAt, slotMinutes } = slotCheck;

  try {
    const row = await prisma.carWashBooking.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        phone,
        plateNumber: parsed.data.plateNumber ?? "",
        customerName: parsed.data.customerName,
        scheduledAt,
        durationMinutes: slotMinutes,
      },
    });

    return NextResponse.json({ booking: mapBooking(row) });
  } catch (e) {
    console.error("[car-wash/bookings POST]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "บันทึกคิวไม่สำเร็จ — ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}

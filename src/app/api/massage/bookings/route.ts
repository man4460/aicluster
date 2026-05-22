import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { massageOwnerFromAuth } from "@/lib/massage/api-owner";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { assertBookingSlotAvailable } from "@/lib/massage/booking-slot-availability";
import { bangkokDayRangeFromDateKey } from "@/lib/massage/booking-datetime";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

const postSchema = z.object({
  phone: z.string().min(9).max(32),
  massageCustomerId: z
    .union([z.number().int().positive(), z.null()])
    .optional()
    .transform((v) => v ?? null),
  customerName: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === undefined) return null;
      const t = String(v).trim();
      return t.length > 0 ? t.slice(0, 100) : null;
    }),
  scheduledAtLocal: z.string().min(10).max(40),
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
  massageCustomerId: number | null;
}) {
  return {
    id: row.id,
    phone: row.phone,
    customerName: row.customerName,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    massageCustomerId: row.massageCustomerId,
  };
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getMassageDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("date")?.trim() || bangkokDateKey();
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const rows = await prisma.massageBooking.findMany({
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
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getMassageDataScope(own.ownerId);

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

  let massageCustomerId: number | null = parsed.data.massageCustomerId ?? null;
  if (massageCustomerId != null) {
    const c = await prisma.massageCustomer.findFirst({
      where: {
        id: massageCustomerId,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        phone,
      },
    });
    if (!c) {
      return NextResponse.json({ error: "ลูกค้าไม่ตรงกับเบอร์" }, { status: 400 });
    }
  } else {
    const existing = await prisma.massageCustomer.findUnique({
      where: {
        ownerUserId_phone_trialSessionId: {
          ownerUserId: own.ownerId,
          phone,
          trialSessionId: scope.trialSessionId,
        },
      },
    });
    if (existing) massageCustomerId = existing.id;
  }

  const name = parsed.data.customerName;

  try {
    const row = await prisma.massageBooking.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        phone,
        massageCustomerId,
        customerName: name,
        scheduledAt,
        durationMinutes: slotMinutes,
      },
    });

    return NextResponse.json({ booking: mapBooking(row) });
  } catch (e) {
    console.error("[massage/bookings POST]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "บันทึกคิวไม่สำเร็จ — ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}

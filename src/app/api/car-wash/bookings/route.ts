import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDayRangeFromDateKey } from "@/lib/car-wash/booking-datetime";
import { createCarWashBookingWithPayment } from "@/lib/car-wash/create-booking";
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
  packageId: z.number().int().min(1),
  paymentMethod: z.string().max(24).optional().nullable(),
  amountPaidBaht: z.number().int().min(0).max(9_999_999).optional().nullable(),
  paymentSlipUrl: z.string().max(512).optional().nullable(),
  forcePaymentMode: z.enum(["NONE", "DEPOSIT", "FULL"]).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function mapBooking(row: {
  id: number;
  phone: string;
  plateNumber: string;
  customerName: string | null;
  packageId: number | null;
  packageName: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  packagePrice?: number;
  depositAmountBaht?: number | null;
  amountPaidBaht?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentSlipUrl?: string;
  visit?: { id: number } | null;
}) {
  return {
    id: row.id,
    phone: row.phone,
    plateNumber: row.plateNumber,
    customerName: row.customerName,
    packageId: row.packageId,
    packageName: row.packageName,
    durationMinutes: row.durationMinutes,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    packagePrice: row.packagePrice ?? 0,
    depositAmountBaht: row.depositAmountBaht ?? null,
    amountPaidBaht: row.amountPaidBaht ?? 0,
    paymentMethod: row.paymentMethod ?? "UNPAID",
    paymentStatus: row.paymentStatus ?? "UNPAID",
    paymentSlipUrl: row.paymentSlipUrl ?? "",
    visitId: row.visit?.id ?? null,
  };
}

export async function GET(req: Request) {
  const own = await getCarWashOwnerOrStaffContext(req);
  if (!own.ok) return own.res;

  const scope = { trialSessionId: own.trialSessionId };
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
    include: { visit: { select: { id: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ bookings: rows.map(mapBooking), date: dateKey });
}

export async function POST(req: Request) {
  const own = await getCarWashOwnerOrStaffContext(req);
  if (!own.ok) return own.res;

  const scope = { trialSessionId: own.trialSessionId };

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

  try {
    const result = await createCarWashBookingWithPayment(prisma, own.ownerId, scope.trialSessionId, {
      phone,
      plateNumber: parsed.data.plateNumber,
      customerName: parsed.data.customerName,
      packageId: parsed.data.packageId,
      scheduledAtLocal: parsed.data.scheduledAtLocal,
      fromPortal: false,
      payment: {
        paymentMethod: parsed.data.paymentMethod,
        amountPaidBaht: parsed.data.amountPaidBaht,
        paymentSlipUrl: parsed.data.paymentSlipUrl,
        forceMode: parsed.data.forcePaymentMode ?? null,
      },
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ booking: mapBooking({ ...result.booking, visit: null }) });
  } catch (e) {
    console.error("[car-wash/bookings POST]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "บันทึกคิวไม่สำเร็จ — ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}

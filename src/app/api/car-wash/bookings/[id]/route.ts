import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import type { CarWashBookingStatus } from "@/generated/prisma/enums";
import { assertBookingSlotAvailable } from "@/lib/car-wash/booking-slot-availability";
import {
  bookingStatusShouldEnsureVisit,
  ensureCarWashVisitForBooking,
  visitStatusForBookingStatus,
} from "@/lib/car-wash/ensure-visit-for-booking";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    status: z.enum(["ARRIVED", "IN_SERVICE", "COMPLETED", "NO_SHOW", "CANCELLED"]).optional(),
    phone: z.string().min(9).max(32).optional(),
    plateNumber: z.string().max(64).optional().nullable(),
    customerName: z.string().max(160).optional().nullable(),
    packageId: z.number().int().min(1).optional(),
    scheduledAtLocal: z.string().min(10).max(40).optional(),
    note: z.string().max(255).optional().nullable(),
  })
  .refine(
    (d) =>
      d.status != null ||
      d.phone != null ||
      d.plateNumber !== undefined ||
      d.customerName !== undefined ||
      d.packageId != null ||
      d.scheduledAtLocal != null ||
      d.note !== undefined,
    { message: "ไม่มีข้อมูลอัปเดต" },
  );

const ALLOWED: Record<CarWashBookingStatus, CarWashBookingStatus[]> = {
  SCHEDULED: ["ARRIVED", "NO_SHOW", "CANCELLED"],
  ARRIVED: ["IN_SERVICE", "NO_SHOW", "CANCELLED"],
  IN_SERVICE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function mapBooking(
  row: {
    id: number;
    phone: string;
    plateNumber: string;
    customerName: string | null;
    packageId: number | null;
    packageName: string;
    durationMinutes: number;
    scheduledAt: Date;
    status: string;
    packagePrice: number;
    depositAmountBaht: number | null;
    amountPaidBaht: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentSlipUrl: string;
  },
  visitId: number | null,
) {
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
    packagePrice: row.packagePrice,
    depositAmountBaht: row.depositAmountBaht,
    amountPaidBaht: row.amountPaidBaht,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    paymentSlipUrl: row.paymentSlipUrl,
    visitId,
  };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getCarWashDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.carWashBooking.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    include: { visit: { select: { id: true } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (parsed.data.phone != null) {
    const phone = normalizePhone(parsed.data.phone);
    if (phone.length < 9) {
      return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
    }
    data.phone = phone;
  }
  if (parsed.data.plateNumber !== undefined) {
    data.plateNumber = String(parsed.data.plateNumber ?? "")
      .trim()
      .replace(/\s+/g, "")
      .slice(0, 64);
  }
  if (parsed.data.customerName !== undefined) {
    const t = parsed.data.customerName?.trim() ?? "";
    data.customerName = t.length > 0 ? t.slice(0, 160) : null;
  }
  if (parsed.data.note !== undefined) {
    const t = parsed.data.note?.trim() ?? "";
    data.note = t.length > 0 ? t.slice(0, 255) : null;
  }

  let durationMinutes = existing.durationMinutes;
  if (parsed.data.packageId != null) {
    let pkg = await prisma.carWashPackage.findFirst({
      where: {
        id: parsed.data.packageId,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        isActive: true,
      },
    });
    if (!pkg && scope.trialSessionId !== TRIAL_PROD_SCOPE) {
      pkg = await prisma.carWashPackage.findFirst({
        where: {
          id: parsed.data.packageId,
          ownerUserId: own.ownerId,
          trialSessionId: TRIAL_PROD_SCOPE,
          isActive: true,
        },
      });
    }
    if (!pkg) return NextResponse.json({ error: "ไม่พบบริการที่เลือก" }, { status: 400 });
    data.packageId = pkg.id;
    data.packageName = pkg.name;
    data.durationMinutes = pkg.durationMinutes;
    data.packagePrice = pkg.price;
    durationMinutes = pkg.durationMinutes;
  }

  if (parsed.data.scheduledAtLocal != null || parsed.data.packageId != null) {
    const local =
      parsed.data.scheduledAtLocal ??
      existing.scheduledAt.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace(" ", "T").slice(0, 16);
    const slotCheck = await assertBookingSlotAvailable(
      prisma,
      own.ownerId,
      scope.trialSessionId,
      local,
      durationMinutes,
      id,
    );
    if (!slotCheck.ok) {
      return NextResponse.json({ error: slotCheck.error }, { status: 400 });
    }
    data.scheduledAt = slotCheck.scheduledAt;
  }

  if (parsed.data.status != null) {
    const next = parsed.data.status;
    const allowed = ALLOWED[existing.status] ?? [];
    if (!allowed.includes(next)) {
      return NextResponse.json(
        { error: `ไม่สามารถเปลี่ยนจาก ${existing.status} เป็น ${next} ได้` },
        { status: 400 },
      );
    }
    data.status = next;
  }

  const row = await prisma.carWashBooking.update({
    where: { id },
    data,
  });

  let visitId: number | null = existing.visit?.id ?? null;
  if (parsed.data.status != null && bookingStatusShouldEnsureVisit(parsed.data.status)) {
    const force = visitStatusForBookingStatus(parsed.data.status) ?? "QUEUED";
    const ensured = await ensureCarWashVisitForBooking(prisma, row, {
      recordedByName: auth.session.username || "พนักงาน",
      forceStatus: force,
    });
    visitId = ensured.visitId;
    if (!ensured.created && force === "WASHING") {
      await prisma.carWashVisit.updateMany({
        where: {
          id: ensured.visitId,
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
        },
        data: { serviceStatus: "WASHING" },
      });
    }
  }

  return NextResponse.json({ booking: mapBooking(row, visitId) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getCarWashDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const existing = await prisma.carWashBooking.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  await prisma.carWashBooking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

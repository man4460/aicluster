import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDayRangeFromDateKey, parseBangkokLocalToDate } from "@/lib/barber/booking-datetime";
import {
  barberMapStylistSchedule,
  barberStylistAllowsSlot,
  barberStylistIsOffOnDate,
} from "@/systems/barber/lib/stylist-schedule";
import {
  barberMinutesToHm,
  barberNormalizeDurationMinutes,
  barberNormalizeSlotMinutes,
  barberParseHmToMinutes,
  barberScheduledLocalIsPastBangkok,
  barberSlotsNeeded,
} from "@/systems/barber/lib/booking-slots";
import {
  barberSlotRunConflicts,
  loadBarberBusyRanges,
} from "@/systems/barber/lib/booking-availability";

const postSchema = z.object({
  phone: z.string().min(9).max(32),
  barberCustomerId: z.number().int().positive().optional().nullable(),
  customerName: z.string().trim().max(100).optional().nullable(),
  /** YYYY-MM-DDTHH:mm เวลาไทย */
  scheduledAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  packageId: z.number().int().positive(),
  stylistId: z.number().int().positive().optional().nullable(),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
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
  durationMinutes?: number;
  stylistId?: number | null;
  packageId?: number | null;
  package?: { id: number; name: string; durationMinutes: number } | null;
  stylist?: { id: number; name: string } | null;
}) {
  return {
    id: row.id,
    phone: row.phone,
    customerName: row.customerName,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    barberCustomerId: row.barberCustomerId,
    durationMinutes: row.durationMinutes ?? 30,
    stylistId: row.stylistId ?? null,
    packageId: row.packageId ?? null,
    packageName: row.package?.name ?? null,
    stylistName: row.stylist?.name ?? null,
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
    include: {
      package: { select: { id: true, name: true, durationMinutes: true } },
      stylist: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ bookings: rows.map(mapBooking), date: dateKey });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
  const ownerId = own.ownerId;
  const trialSessionId = scope.trialSessionId;

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
  if (barberScheduledLocalIsPastBangkok(parsed.data.scheduledAtLocal)) {
    return NextResponse.json({ error: "เลือกวันเวลาที่ยังไม่ผ่านไป" }, { status: 400 });
  }

  const [profile, stylistCount] = await Promise.all([
    prisma.barberShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: { openTime: true, closeTime: true, slotMinutes: true },
    }),
    prisma.barberStylist.count({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
    }),
  ]);

  const slotMinutes = barberNormalizeSlotMinutes(profile?.slotMinutes ?? 30);
  const openTime =
    profile?.openTime && barberParseHmToMinutes(profile.openTime) != null
      ? profile.openTime
      : "09:00";
  const closeTime =
    profile?.closeTime && barberParseHmToMinutes(profile.closeTime) != null
      ? profile.closeTime
      : "20:00";

  let stylistId: number | null = parsed.data.stylistId ?? null;
  let stylistSchedule: ReturnType<typeof barberMapStylistSchedule> | null = null;
  if (stylistCount > 0) {
    if (stylistId == null) {
      return NextResponse.json({ error: "กรุณาเลือกช่าง" }, { status: 400 });
    }
    const stylist = await prisma.barberStylist.findFirst({
      where: {
        id: stylistId,
        ownerUserId: ownerId,
        trialSessionId,
        isActive: true,
      },
      select: {
        id: true,
        workStartTime: true,
        workEndTime: true,
        workWeekdaysJson: true,
      },
    });
    if (!stylist) {
      return NextResponse.json({ error: "ไม่พบช่าง" }, { status: 400 });
    }
    stylistSchedule = barberMapStylistSchedule(stylist);
  } else {
    stylistId = null;
  }

  const pkg = await prisma.barberPackage.findFirst({
    where: {
      id: parsed.data.packageId,
      ownerUserId: ownerId,
      trialSessionId,
    },
    select: { id: true, name: true, durationMinutes: true },
  });
  if (!pkg) {
    return NextResponse.json({ error: "ไม่พบบริการ/แพ็กเกจ" }, { status: 400 });
  }
  const packageId = pkg.id;
  const durationMinutes = barberNormalizeDurationMinutes(pkg.durationMinutes, slotMinutes);
  const slotsNeeded = barberSlotsNeeded(durationMinutes, slotMinutes);

  const startHm = parsed.data.scheduledAtLocal.slice(11, 16);
  const dateKey = parsed.data.scheduledAtLocal.slice(0, 10);
  const startMin = barberParseHmToMinutes(startHm);
  const openMin = barberParseHmToMinutes(openTime);
  const closeMin = barberParseHmToMinutes(closeTime);
  if (startMin == null || openMin == null || closeMin == null) {
    return NextResponse.json({ error: "เวลาไม่ถูกต้อง" }, { status: 400 });
  }
  if (startMin < openMin || startMin + slotsNeeded * slotMinutes > closeMin) {
    return NextResponse.json({ error: "เวลานอกช่วงเปิดร้าน" }, { status: 400 });
  }

  if (stylistSchedule) {
    if (barberStylistIsOffOnDate(stylistSchedule, dateKey)) {
      return NextResponse.json({ error: "ช่างไม่รับบริการวันนี้" }, { status: 400 });
    }
    for (let i = 0; i < slotsNeeded; i++) {
      const hm = barberMinutesToHm(startMin + i * slotMinutes);
      if (
        !barberStylistAllowsSlot({
          schedule: stylistSchedule,
          dateKey,
          startHm: hm,
          slotMinutes,
        })
      ) {
        return NextResponse.json(
          { error: "เวลานี้อยู่นอกช่วงรับคิวของช่าง" },
          { status: 400 },
        );
      }
    }
  }

  const busy = await loadBarberBusyRanges({
    ownerId,
    trialSessionId,
    dateKey,
    stylistId,
  });
  if (barberSlotRunConflicts(startHm, slotsNeeded, slotMinutes, busy)) {
    return NextResponse.json({ error: "ช่วงเวลานี้ถูกจองแล้ว" }, { status: 409 });
  }

  let barberCustomerId: number | null = parsed.data.barberCustomerId ?? null;
  const name =
    parsed.data.customerName != null && parsed.data.customerName.length > 0
      ? parsed.data.customerName.trim().slice(0, 100)
      : null;

  if (barberCustomerId != null) {
    const c = await prisma.barberCustomer.findFirst({
      where: {
        id: barberCustomerId,
        ownerUserId: ownerId,
        trialSessionId,
        phone,
      },
    });
    if (!c) {
      return NextResponse.json({ error: "ลูกค้าไม่ตรงกับเบอร์" }, { status: 400 });
    }
    if (name && name !== (c.name ?? "")) {
      await prisma.barberCustomer.update({ where: { id: c.id }, data: { name } });
    }
  } else {
    const existing = await prisma.barberCustomer.findUnique({
      where: {
        ownerUserId_phone_trialSessionId: {
          ownerUserId: ownerId,
          phone,
          trialSessionId,
        },
      },
    });
    if (existing) {
      barberCustomerId = existing.id;
      if (name && name !== (existing.name ?? "")) {
        await prisma.barberCustomer.update({ where: { id: existing.id }, data: { name } });
      }
    } else {
      const created = await prisma.barberCustomer.create({
        data: { ownerUserId: ownerId, trialSessionId, phone, name },
      });
      barberCustomerId = created.id;
    }
  }

  const row = await prisma.barberBooking.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      phone,
      barberCustomerId,
      customerName: name,
      scheduledAt,
      durationMinutes,
      stylistId,
      packageId,
      status: "SCHEDULED",
    },
    include: {
      package: { select: { id: true, name: true, durationMinutes: true } },
      stylist: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ booking: mapBooking(row) });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseBangkokLocalToDate } from "@/lib/barber/booking-datetime";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { resolvePublicBarberTrialSessionId } from "@/lib/barber/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
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

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  t: z.string().trim().max(36).optional().nullable(),
  phone: z.string().min(1).max(32),
  customerName: z.string().trim().max(100).optional().nullable(),
  stylistId: z.number().int().positive().optional().nullable(),
  packageId: z.number().int().positive().optional().nullable(),
  /** YYYY-MM-DDTHH:mm เวลาไทย */
  scheduledLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** จองคิวจากลิงก์ลูกค้า */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const ownerId = parsed.data.ownerId;
  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const rl = rateLimit(`barber-portal-book:${ip}:${ownerId}`, 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "จองถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicBarberTrialSessionId(ownerId, parsed.data.t);
  const scheduledAt = parseBangkokLocalToDate(parsed.data.scheduledLocal);
  if (!scheduledAt || barberScheduledLocalIsPastBangkok(parsed.data.scheduledLocal)) {
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

  let packageId: number | null = parsed.data.packageId ?? null;
  if (packageId == null) {
    return NextResponse.json({ error: "กรุณาเลือกบริการก่อนจอง" }, { status: 400 });
  }
  let durationMinutes = barberNormalizeDurationMinutes(
    parsed.data.durationMinutes ?? slotMinutes,
    slotMinutes,
  );

  {
    const pkg = await prisma.barberPackage.findFirst({
      where: { id: packageId, ownerUserId: ownerId, trialSessionId },
      select: { id: true, durationMinutes: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 400 });
    }
    packageId = pkg.id;
    durationMinutes = barberNormalizeDurationMinutes(pkg.durationMinutes, slotMinutes);
  }

  const slotsNeeded = barberSlotsNeeded(durationMinutes, slotMinutes);
  const startHm = parsed.data.scheduledLocal.slice(11, 16);
  const dateKey = parsed.data.scheduledLocal.slice(0, 10);
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

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: { ownerUserId: ownerId, phone, trialSessionId },
  } as const;
  const name =
    parsed.data.customerName != null && parsed.data.customerName.length > 0
      ? parsed.data.customerName.trim().slice(0, 100)
      : null;

  let customer = await prisma.barberCustomer.findUnique({ where: whereCustomer });
  if (!customer) {
    customer = await prisma.barberCustomer.create({
      data: { ownerUserId: ownerId, trialSessionId, phone, name },
    });
  } else if (name) {
    customer = await prisma.barberCustomer.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  const row = await prisma.barberBooking.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      barberCustomerId: customer.id,
      phone,
      customerName: name ?? customer.name,
      scheduledAt,
      durationMinutes,
      stylistId,
      packageId,
      status: "SCHEDULED",
    },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      phone: true,
      customerName: true,
      durationMinutes: true,
      stylistId: true,
      packageId: true,
    },
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: row.id,
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status,
      phone: row.phone,
      customerName: row.customerName,
      durationMinutes: row.durationMinutes,
      stylistId: row.stylistId,
      packageId: row.packageId,
      slotsNeeded,
    },
  });
}

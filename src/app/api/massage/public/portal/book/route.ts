import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseBangkokLocalToDate } from "@/lib/massage/booking-datetime";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  massageMapTherapistSchedule,
  massageTherapistAllowsSlot,
  massageTherapistIsOffOnDate,
} from "@/systems/massage/lib/therapist-schedule";
import {
  massageMinutesToHm,
  massageNormalizeDurationMinutes,
  massageNormalizeSlotMinutes,
  massageParseHmToMinutes,
  massageScheduledLocalIsPastBangkok,
  massageSlotsNeeded,
} from "@/systems/massage/lib/booking-slots";
import {
  massageSlotRunConflicts,
  loadMassageBusyRanges,
} from "@/systems/massage/lib/booking-availability";
import { resolveMassageBookingPayment } from "@/systems/massage/lib/resolve-booking-payment";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  t: z.string().trim().max(36).optional().nullable(),
  phone: z.string().min(1).max(32),
  customerName: z.string().trim().max(100).optional().nullable(),
  therapistId: z.number().int().positive().optional().nullable(),
  packageId: z.number().int().positive().optional().nullable(),
  /** YYYY-MM-DDTHH:mm เวลาไทย — รองรับ scheduledAtLocal จากเช็คอินเก่า */
  scheduledLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .optional(),
  scheduledAtLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
    .optional(),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
  /** ใช้สิทธิ์สมาชิกแพ็ก — ไม่บังคับมัดจำ/ชำระเต็ม */
  useMemberPackage: z.boolean().optional().nullable(),
  paymentMethod: z.enum(["PROMPTPAY", "TRANSFER"]).optional().nullable(),
  paymentSlipUrl: z.string().max(512).optional().nullable(),
  amountPaidBaht: z.number().int().min(0).max(9_999_999).optional().nullable(),
  massageCustomerId: z.number().int().positive().optional().nullable(),
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

  const rl = rateLimit(`massage-portal-book:${ip}:${ownerId}`, 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "จองถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(ownerId, parsed.data.t);

  const scheduledLocalRaw =
    parsed.data.scheduledLocal ??
    (parsed.data.scheduledAtLocal
      ? parsed.data.scheduledAtLocal.slice(0, 16)
      : null);
  if (!scheduledLocalRaw) {
    return NextResponse.json({ error: "เลือกวันเวลา" }, { status: 400 });
  }

  const scheduledAt = parseBangkokLocalToDate(scheduledLocalRaw);
  if (!scheduledAt || massageScheduledLocalIsPastBangkok(scheduledLocalRaw)) {
    return NextResponse.json({ error: "เลือกวันเวลาที่ยังไม่ผ่านไป" }, { status: 400 });
  }

  const [profile, therapistCount] = await Promise.all([
    prisma.massageShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: {
        openTime: true,
        closeTime: true,
        slotMinutes: true,
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
      },
    }),
    prisma.massageTherapist.count({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
    }),
  ]);

  const slotMinutes = massageNormalizeSlotMinutes(profile?.slotMinutes ?? 60);
  const openTime =
    profile?.openTime && massageParseHmToMinutes(profile.openTime) != null
      ? profile.openTime
      : "09:00";
  const closeTime =
    profile?.closeTime && massageParseHmToMinutes(profile.closeTime) != null
      ? profile.closeTime
      : "21:00";

  let therapistId: number | null = parsed.data.therapistId ?? null;
  let therapistSchedule: ReturnType<typeof massageMapTherapistSchedule> | null = null;
  if (therapistCount > 0) {
    if (therapistId == null) {
      return NextResponse.json({ error: "กรุณาเลือกนักบำบัด" }, { status: 400 });
    }
    const therapist = await prisma.massageTherapist.findFirst({
      where: {
        id: therapistId,
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
    if (!therapist) {
      return NextResponse.json({ error: "ไม่พบนักบำบัด" }, { status: 400 });
    }
    therapistSchedule = massageMapTherapistSchedule(therapist);
  } else {
    therapistId = null;
  }

  let packageId: number | null = parsed.data.packageId ?? null;
  if (packageId == null) {
    return NextResponse.json({ error: "กรุณาเลือกบริการก่อนจอง" }, { status: 400 });
  }
  let durationMinutes = massageNormalizeDurationMinutes(
    parsed.data.durationMinutes ?? slotMinutes,
    slotMinutes,
  );
  let packagePriceBaht = 0;

  {
    const pkg = await prisma.massagePackage.findFirst({
      where: { id: packageId, ownerUserId: ownerId, trialSessionId },
      select: { id: true, durationMinutes: true, price: true },
    });
    if (!pkg) {
      return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 400 });
    }
    packageId = pkg.id;
    durationMinutes = massageNormalizeDurationMinutes(pkg.durationMinutes, slotMinutes);
    packagePriceBaht = Math.max(0, Math.round(Number(pkg.price) || 0));
  }

  const payResolved = resolveMassageBookingPayment({
    shopMode: profile?.portalBookingPaymentMode,
    shopDepositAmountBaht: profile?.depositAmountBaht,
    packagePriceBaht,
    forceMode: parsed.data.useMemberPackage ? "NONE" : null,
    paymentMethod: parsed.data.paymentMethod,
    paymentSlipUrl: parsed.data.paymentSlipUrl,
    amountPaidBaht: parsed.data.amountPaidBaht,
  });
  if (!payResolved.ok) {
    return NextResponse.json({ error: payResolved.error }, { status: 400 });
  }

  const slotsNeeded = massageSlotsNeeded(durationMinutes, slotMinutes);
  const startHm = scheduledLocalRaw.slice(11, 16);
  const dateKey = scheduledLocalRaw.slice(0, 10);
  const startMin = massageParseHmToMinutes(startHm);
  const openMin = massageParseHmToMinutes(openTime);
  const closeMin = massageParseHmToMinutes(closeTime);
  if (startMin == null || openMin == null || closeMin == null) {
    return NextResponse.json({ error: "เวลาไม่ถูกต้อง" }, { status: 400 });
  }
  if (startMin < openMin || startMin + slotsNeeded * slotMinutes > closeMin) {
    return NextResponse.json({ error: "เวลานอกช่วงเปิดร้าน" }, { status: 400 });
  }

  if (therapistSchedule) {
    if (massageTherapistIsOffOnDate(therapistSchedule, dateKey)) {
      return NextResponse.json({ error: "นักบำบัดไม่รับบริการวันนี้" }, { status: 400 });
    }
    for (let i = 0; i < slotsNeeded; i++) {
      const hm = massageMinutesToHm(startMin + i * slotMinutes);
      if (
        !massageTherapistAllowsSlot({
          schedule: therapistSchedule,
          dateKey,
          startHm: hm,
          slotMinutes,
        })
      ) {
        return NextResponse.json(
          { error: "เวลานี้อยู่นอกช่วงรับคิวของนักบำบัด" },
          { status: 400 },
        );
      }
    }
  }

  const busy = await loadMassageBusyRanges({
    ownerId,
    trialSessionId,
    dateKey,
    therapistId,
  });
  if (massageSlotRunConflicts(startHm, slotsNeeded, slotMinutes, busy)) {
    return NextResponse.json({ error: "ช่วงเวลานี้ถูกจองแล้ว" }, { status: 409 });
  }

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: { ownerUserId: ownerId, phone, trialSessionId },
  } as const;
  const name =
    parsed.data.customerName != null && parsed.data.customerName.length > 0
      ? parsed.data.customerName.trim().slice(0, 100)
      : null;

  let customer = await prisma.massageCustomer.findUnique({ where: whereCustomer });
  if (!customer) {
    customer = await prisma.massageCustomer.create({
      data: { ownerUserId: ownerId, trialSessionId, phone, name },
    });
  } else if (name) {
    customer = await prisma.massageCustomer.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  if (parsed.data.massageCustomerId != null && parsed.data.massageCustomerId !== customer.id) {
    return NextResponse.json({ error: "ข้อมูลลูกค้าไม่ตรงกับเบอร์" }, { status: 400 });
  }

  const row = await prisma.massageBooking.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      massageCustomerId: customer.id,
      phone,
      customerName: name ?? customer.name,
      scheduledAt,
      durationMinutes,
      therapistId,
      packageId,
      status: "SCHEDULED",
      packagePrice: payResolved.fields.packagePrice,
      depositAmountBaht: payResolved.fields.depositAmountBaht,
      amountPaidBaht: payResolved.fields.amountPaidBaht,
      paymentMethod: payResolved.fields.paymentMethod,
      paymentStatus: payResolved.fields.paymentStatus,
      depositSlipUrl: payResolved.fields.depositSlipUrl,
      paymentSlipUrl: payResolved.fields.paymentSlipUrl,
    },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      phone: true,
      customerName: true,
      durationMinutes: true,
      therapistId: true,
      packageId: true,
      packagePrice: true,
      depositAmountBaht: true,
      amountPaidBaht: true,
      paymentMethod: true,
      paymentStatus: true,
      depositSlipUrl: true,
    },
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: row.id,
      scheduledAt: row.scheduledAt.toISOString(),
      dateLabel: dateKey,
      timeLabel: startHm,
      status: row.status,
      phone: row.phone,
      customerName: row.customerName,
      durationMinutes: row.durationMinutes,
      therapistId: row.therapistId,
      packageId: row.packageId,
      slotsNeeded,
      packagePrice: row.packagePrice,
      depositAmountBaht: row.depositAmountBaht,
      amountPaidBaht: row.amountPaidBaht,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      depositSlipUrl: row.depositSlipUrl,
    },
  });
}

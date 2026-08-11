import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { resolvePublicBarberTrialSessionId } from "@/lib/barber/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  barberBuildDaySlots,
  barberNormalizeSlotMinutes,
  barberParseHmToMinutes,
  barberSlotStartIsPastBangkok,
} from "@/systems/barber/lib/booking-slots";
import {
  barberSlotRunConflicts,
  loadBarberBusyRanges,
} from "@/systems/barber/lib/booking-availability";
import {
  barberMapStylistSchedule,
  barberStylistAllowsSlot,
  barberStylistIsOffOnDate,
} from "@/systems/barber/lib/stylist-schedule";

/** GET สล็อตว่างตามวัน + ช่าง */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const dateKey = url.searchParams.get("date")?.trim() ?? "";
  const stylistRaw = url.searchParams.get("stylistId")?.trim() ?? "";
  const t = url.searchParams.get("t");

  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`barber-portal-avail:${ip}:${ownerId}`, 60, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });
  }

  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicBarberTrialSessionId(ownerId, t);

  const [profile, stylistCount] = await Promise.all([
    prisma.barberShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: { openTime: true, closeTime: true, slotMinutes: true },
    }),
    prisma.barberStylist.count({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
    }),
  ]);

  const openTime =
    profile?.openTime && barberParseHmToMinutes(profile.openTime) != null
      ? profile.openTime
      : "09:00";
  const closeTime =
    profile?.closeTime && barberParseHmToMinutes(profile.closeTime) != null
      ? profile.closeTime
      : "20:00";
  const slotMinutes = barberNormalizeSlotMinutes(profile?.slotMinutes ?? 30);

  let stylistId: number | null = null;
  let stylistSchedule: ReturnType<typeof barberMapStylistSchedule> | null = null;
  if (stylistCount > 0) {
    const sid = Number(stylistRaw);
    if (!Number.isInteger(sid) || sid <= 0) {
      return NextResponse.json({ error: "เลือกช่างก่อน" }, { status: 400 });
    }
    const stylist = await prisma.barberStylist.findFirst({
      where: {
        id: sid,
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
      return NextResponse.json({ error: "ไม่พบช่าง" }, { status: 404 });
    }
    stylistId = stylist.id;
    stylistSchedule = barberMapStylistSchedule(stylist);
  } else if (stylistRaw) {
    const sid = Number(stylistRaw);
    if (Number.isInteger(sid) && sid > 0) {
      const stylist = await prisma.barberStylist.findFirst({
        where: { id: sid, ownerUserId: ownerId, trialSessionId },
        select: {
          id: true,
          workStartTime: true,
          workEndTime: true,
          workWeekdaysJson: true,
        },
      });
      if (stylist) {
        stylistId = stylist.id;
        stylistSchedule = barberMapStylistSchedule(stylist);
      }
    }
  }

  const dayOff = stylistSchedule ? barberStylistIsOffOnDate(stylistSchedule, dateKey) : false;
  const daySlots = dayOff ? [] : barberBuildDaySlots({ openTime, closeTime, slotMinutes });
  const busy = await loadBarberBusyRanges({
    ownerId,
    trialSessionId,
    dateKey,
    stylistId,
  });

  const slots = daySlots.map((startTime) => {
    const withinStylist =
      !stylistSchedule ||
      barberStylistAllowsSlot({
        schedule: stylistSchedule,
        dateKey,
        startHm: startTime,
        slotMinutes,
      });
    return {
      startTime,
      available:
        withinStylist &&
        !barberSlotStartIsPastBangkok(dateKey, startTime) &&
        !barberSlotRunConflicts(startTime, 1, slotMinutes, busy),
    };
  });

  return NextResponse.json({
    slots,
    slotMinutes,
    openTime,
    closeTime,
    stylistDayOff: dayOff,
    stylistSchedule: stylistSchedule
      ? {
          workStartTime: stylistSchedule.workStartTime,
          workEndTime: stylistSchedule.workEndTime,
          workWeekdays: stylistSchedule.workWeekdays,
        }
      : null,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
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

/** GET สล็อตว่างตามวัน + ช่าง (แดชบอร์ด) — เหมือนพอร์ทัลลูกค้า */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);
  const ownerId = own.ownerId;
  const trialSessionId = scope.trialSessionId;

  const url = new URL(req.url);
  const dateKey = url.searchParams.get("date")?.trim() ?? "";
  const stylistRaw = url.searchParams.get("stylistId")?.trim() ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  massageBuildDaySlots,
  massageNormalizeSlotMinutes,
  massageParseHmToMinutes,
  massageSlotStartIsPastBangkok,
} from "@/systems/massage/lib/booking-slots";
import {
  massageSlotRunConflicts,
  loadMassageBusyRanges,
} from "@/systems/massage/lib/booking-availability";
import {
  massageMapTherapistSchedule,
  massageTherapistAllowsSlot,
  massageTherapistIsOffOnDate,
} from "@/systems/massage/lib/therapist-schedule";

/** GET สล็อตว่างตามวัน + นักบำบัด */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const dateKey = url.searchParams.get("date")?.trim() ?? "";
  const therapistRaw = url.searchParams.get("therapistId")?.trim() ?? "";
  const t = url.searchParams.get("t");

  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const rl = rateLimit(`massage-portal-avail:${ip}:${ownerId}`, 60, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "เรียกถี่เกินไป" }, { status: 429 });
  }

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(ownerId, t);

  const [profile, therapistCount] = await Promise.all([
    prisma.massageShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: { openTime: true, closeTime: true, slotMinutes: true },
    }),
    prisma.massageTherapist.count({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
    }),
  ]);

  const openTime =
    profile?.openTime && massageParseHmToMinutes(profile.openTime) != null
      ? profile.openTime
      : "09:00";
  const closeTime =
    profile?.closeTime && massageParseHmToMinutes(profile.closeTime) != null
      ? profile.closeTime
      : "21:00";
  const slotMinutes = massageNormalizeSlotMinutes(profile?.slotMinutes ?? 60);

  let therapistId: number | null = null;
  let therapistSchedule: ReturnType<typeof massageMapTherapistSchedule> | null = null;
  if (therapistCount > 0) {
    const sid = Number(therapistRaw);
    if (!Number.isInteger(sid) || sid <= 0) {
      return NextResponse.json({ error: "เลือกนักบำบัดก่อน" }, { status: 400 });
    }
    const therapist = await prisma.massageTherapist.findFirst({
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
    if (!therapist) {
      return NextResponse.json({ error: "ไม่พบนักบำบัด" }, { status: 404 });
    }
    therapistId = therapist.id;
    therapistSchedule = massageMapTherapistSchedule(therapist);
  } else if (therapistRaw) {
    const sid = Number(therapistRaw);
    if (Number.isInteger(sid) && sid > 0) {
      const therapist = await prisma.massageTherapist.findFirst({
        where: { id: sid, ownerUserId: ownerId, trialSessionId },
        select: {
          id: true,
          workStartTime: true,
          workEndTime: true,
          workWeekdaysJson: true,
        },
      });
      if (therapist) {
        therapistId = therapist.id;
        therapistSchedule = massageMapTherapistSchedule(therapist);
      }
    }
  }

  const dayOff = therapistSchedule ? massageTherapistIsOffOnDate(therapistSchedule, dateKey) : false;
  const daySlots = dayOff ? [] : massageBuildDaySlots({ openTime, closeTime, slotMinutes });
  const busy = await loadMassageBusyRanges({
    ownerId,
    trialSessionId,
    dateKey,
    therapistId,
  });

  const slots = daySlots.map((startTime) => {
    const withinTherapist =
      !therapistSchedule ||
      massageTherapistAllowsSlot({
        schedule: therapistSchedule,
        dateKey,
        startHm: startTime,
        slotMinutes,
      });
    return {
      startTime,
      available:
        withinTherapist &&
        !massageSlotStartIsPastBangkok(dateKey, startTime) &&
        !massageSlotRunConflicts(startTime, 1, slotMinutes, busy),
    };
  });

  return NextResponse.json({
    slots,
    slotMinutes,
    openTime,
    closeTime,
    therapistDayOff: dayOff,
    therapistSchedule: therapistSchedule
      ? {
          workStartTime: therapistSchedule.workStartTime,
          workEndTime: therapistSchedule.workEndTime,
          workWeekdays: therapistSchedule.workWeekdays,
        }
      : null,
  });
}

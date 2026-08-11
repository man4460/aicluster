import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { normalizeTimeHHmm, DEFAULT_CAR_WASH_DAY } from "@/lib/car-wash/slot-times";
import {
  carWashNormalizeOpenWeekdays,
  carWashSerializeOpenWeekdays,
} from "@/lib/car-wash/shop-hours";

function mapProfile(row: {
  openTime: string;
  closeTime: string;
  defaultSlotMinutes: number;
  openWeekdaysJson: string;
}) {
  return {
    openTime: row.openTime || DEFAULT_CAR_WASH_DAY.openTime,
    closeTime: row.closeTime || DEFAULT_CAR_WASH_DAY.closeTime,
    slotMinutes: Math.max(15, row.defaultSlotMinutes || DEFAULT_CAR_WASH_DAY.slotMinutes),
    openWeekdays: carWashNormalizeOpenWeekdays(row.openWeekdaysJson),
  };
}

async function ensureProfile(ownerUserId: string, trialSessionId: string) {
  return prisma.carWashShopProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    create: {
      ownerUserId,
      trialSessionId,
      openTime: DEFAULT_CAR_WASH_DAY.openTime,
      closeTime: DEFAULT_CAR_WASH_DAY.closeTime,
      defaultSlotMinutes: DEFAULT_CAR_WASH_DAY.slotMinutes,
      openWeekdaysJson: carWashSerializeOpenWeekdays([...Array(7).keys()]),
    },
    update: {},
  });
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);
  const row = await ensureProfile(own.ownerId, scope.trialSessionId);
  return NextResponse.json({ hours: mapProfile(row) });
}

const patchSchema = z.object({
  openTime: z.string().min(4).max(5).optional(),
  closeTime: z.string().min(4).max(5).optional(),
  slotMinutes: z.number().int().min(15).max(240).optional(),
  openWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
});

export async function PATCH(req: Request) {
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
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const data: {
    openTime?: string;
    closeTime?: string;
    defaultSlotMinutes?: number;
    openWeekdaysJson?: string;
  } = {};

  if (parsed.data.openTime != null) {
    const t = normalizeTimeHHmm(parsed.data.openTime);
    if (!t) return NextResponse.json({ error: "เวลาเปิดไม่ถูกต้อง" }, { status: 400 });
    data.openTime = t;
  }
  if (parsed.data.closeTime != null) {
    const t = normalizeTimeHHmm(parsed.data.closeTime);
    if (!t) return NextResponse.json({ error: "เวลาปิดไม่ถูกต้อง" }, { status: 400 });
    data.closeTime = t;
  }
  if (parsed.data.slotMinutes != null) {
    data.defaultSlotMinutes = parsed.data.slotMinutes;
  }
  if (parsed.data.openWeekdays != null) {
    data.openWeekdaysJson = carWashSerializeOpenWeekdays(parsed.data.openWeekdays);
  }

  const open = data.openTime;
  const close = data.closeTime;
  if (open && close && open >= close) {
    return NextResponse.json({ error: "เวลาปิดต้องหลังเวลาเปิด" }, { status: 400 });
  }

  await ensureProfile(own.ownerId, scope.trialSessionId);
  const row = await prisma.carWashShopProfile.update({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    },
    data,
  });

  if (!data.openTime && !data.closeTime) {
    // still validate existing after partial
    if (row.openTime >= row.closeTime) {
      return NextResponse.json({ error: "เวลาปิดต้องหลังเวลาเปิด" }, { status: 400 });
    }
  }

  return NextResponse.json({ hours: mapProfile(row) });
}

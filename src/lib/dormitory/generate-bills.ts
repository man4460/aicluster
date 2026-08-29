import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import {
  computeUtilityTotalRoomAmount,
  refreshPendingSplitPaymentsForBill,
} from "@/systems/dormitory/lib/split-payments";

/** ค่าเริ่มเมื่อยังไม่มีบิลก่อนหน้า (สอดคล้อง RoomDetailClient) */
const DEFAULT_WATER_PRICE = 18;
const DEFAULT_ELECTRIC_PRICE = 5;

export type GenerateDormBillsResult = {
  created: number;
  skipped: number;
};

function parseYearMonth(yearMonth: string): { billingYear: number; billingMonth: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(yearMonth.trim());
  if (!m) return null;
  const billingYear = Number(m[1]);
  const billingMonth = Number(m[2]);
  if (
    !Number.isInteger(billingYear) ||
    !Number.isInteger(billingMonth) ||
    billingMonth < 1 ||
    billingMonth > 12
  ) {
    return null;
  }
  return { billingYear, billingMonth };
}

/**
 * สร้างบิลเชลล์เดือน YYYY-MM สำหรับห้องที่มีผู้พัก ACTIVE
 * — ไม่ทับบิลที่มีอยู่แล้ว (มิเตอร์เป็นความจริงของเจ้าของหอ)
 * — พกเลขมิเตอร์/ราคา/ค่าคงที่จากงวดก่อน (ถ้ามี) · การใช้น้ำไฟงวดนี้ = 0 จนกว่าจะแก้
 * — แล้วสร้าง/อัปเดตแถวแบ่งค่าเช่า (+ ยูทิลิตี้ 0) รายคน
 */
export async function generateDormBillsForScope(args: {
  ownerUserId: string;
  trialSessionId: string;
  yearMonth: string;
  roomIds?: number[];
}): Promise<GenerateDormBillsResult> {
  const { ownerUserId, trialSessionId, yearMonth, roomIds } = args;
  const period = parseYearMonth(yearMonth);
  if (!period) return { created: 0, skipped: 0 };

  const { billingYear, billingMonth } = period;

  const rooms = await prisma.room.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      ...(roomIds?.length ? { id: { in: roomIds } } : {}),
      tenants: { some: { status: "ACTIVE" } },
    },
    include: {
      tenants: {
        where: { status: "ACTIVE" },
        select: { checkInDate: true },
        orderBy: { checkInDate: "asc" },
      },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const room of rooms) {
    const earliest = room.tenants[0]?.checkInDate;
    if (earliest) {
      const startYm = bangkokMonthKey(earliest);
      if (yearMonth < startYm) {
        skipped += 1;
        continue;
      }
    }

    const existing = await prisma.utilityBill.findUnique({
      where: {
        roomId_billingYear_billingMonth: {
          roomId: room.id,
          billingYear,
          billingMonth,
        },
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const prev = await prisma.utilityBill.findFirst({
      where: {
        roomId: room.id,
        OR: [
          { billingYear: { lt: billingYear } },
          { billingYear, billingMonth: { lt: billingMonth } },
        ],
      },
      orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
    });

    const waterMeterPrev = prev?.waterMeterCurr ?? 0;
    const electricMeterPrev = prev?.electricMeterCurr ?? 0;
    const waterMeterCurr = waterMeterPrev;
    const electricMeterCurr = electricMeterPrev;
    const waterPrice = prev != null ? Number(prev.waterPrice) : DEFAULT_WATER_PRICE;
    const electricPrice = prev != null ? Number(prev.electricPrice) : DEFAULT_ELECTRIC_PRICE;
    const fixedFeesJson = prev?.fixedFees ?? null;

    const totalRoomAmount = computeUtilityTotalRoomAmount({
      waterMeterPrev,
      waterMeterCurr,
      electricMeterPrev,
      electricMeterCurr,
      waterPrice,
      electricPrice,
      fixedFeesJson,
    });

    const bill = await prisma.utilityBill.create({
      data: {
        roomId: room.id,
        billingYear,
        billingMonth,
        waterMeterPrev,
        waterMeterCurr,
        electricMeterPrev,
        electricMeterCurr,
        waterPrice,
        electricPrice,
        fixedFees:
          fixedFeesJson == null ? Prisma.DbNull : (fixedFeesJson as Prisma.InputJsonValue),
        totalRoomAmount,
      },
    });

    await refreshPendingSplitPaymentsForBill(bill.id);
    created += 1;
  }

  return { created, skipped };
}

/** ถ้าโปรไฟล์เปิด auto (ค่าเริ่ม true) — สร้างบิลเดือนที่ระบุ */
export async function ensureDormAutoBillsForScope(args: {
  ownerUserId: string;
  trialSessionId: string;
  yearMonth?: string;
}): Promise<GenerateDormBillsResult | null> {
  const profile = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: args.ownerUserId,
        trialSessionId: args.trialSessionId,
      },
    },
    select: { autoGenerateBills: true },
  });
  const enabled = profile?.autoGenerateBills ?? true;
  if (!enabled) return null;

  return generateDormBillsForScope({
    ownerUserId: args.ownerUserId,
    trialSessionId: args.trialSessionId,
    yearMonth: args.yearMonth ?? bangkokMonthKey(),
  });
}

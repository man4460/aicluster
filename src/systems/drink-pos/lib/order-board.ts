import type { DrinkPosFulfillmentStatus } from "@/systems/drink-pos/lib/fulfillment-status";
import { prisma } from "@/lib/prisma";

export type DrinkPosOrderBoardLine = {
  id: string;
  productName: string;
  sizeLabel: string | null;
  quantity: number;
};

export type DrinkPosOrderBoardRow = {
  id: string;
  note: string | null;
  totalBaht: number;
  fulfillmentStatus: DrinkPosFulfillmentStatus;
  statusUpdatedAt: string;
  createdAt: string;
  memberPhone: string | null;
  isRewardRedemption: boolean;
  lines: DrinkPosOrderBoardLine[];
};

type SaleRow = {
  id: string;
  note: string | null;
  totalBaht: number;
  fulfillmentStatus: string;
  statusUpdatedAt: Date;
  createdAt: Date;
  memberPhone: string | null;
  isRewardRedemption: boolean;
  lines: {
    id: string;
    productName: string;
    sizeLabel: string | null;
    quantity: number;
  }[];
};

const boardLineInclude = {
  lines: {
    orderBy: { id: "asc" as const },
    select: { id: true, productName: true, sizeLabel: true, quantity: true },
  },
};

export function mapDrinkPosOrderBoardRow(s: SaleRow): DrinkPosOrderBoardRow {
  const status = (["RECEIVED", "MAKING", "DONE"].includes(s.fulfillmentStatus)
    ? s.fulfillmentStatus
    : "RECEIVED") as DrinkPosFulfillmentStatus;
  return {
    id: s.id,
    note: s.note,
    totalBaht: s.totalBaht,
    fulfillmentStatus: status,
    statusUpdatedAt: s.statusUpdatedAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    memberPhone: s.memberPhone,
    isRewardRedemption: s.isRewardRedemption,
    lines: s.lines.map((l) => ({
      id: l.id,
      productName: l.productName,
      sizeLabel: l.sizeLabel,
      quantity: l.quantity,
    })),
  };
}

/** ออเดอร์ในกระดาน: วันนี้ (กทม.) หรือยังไม่เสร็จ */
export function drinkPosOrderBoardSinceDate(): Date {
  const now = new Date();
  const bangkokDate = now.toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // Midnight Bangkok ≈ UTC+7 → use Date from YYYY-MM-DD as Bangkok start via offset
  return new Date(`${bangkokDate}T00:00:00+07:00`);
}

/**
 * ดึงกระดานคิว — คิวที่ยังไม่เสร็จทั้งหมด + เสร็จแล้วของวันนี้
 * (แยก query เพื่อไม่ให้ DONE วันนี้ถูกตัดด้วย take ของออเดอร์เก่า)
 */
export async function fetchDrinkPosOrderBoardRows(ownerUserId: string): Promise<DrinkPosOrderBoardRow[]> {
  const since = drinkPosOrderBoardSinceDate();

  const [active, doneToday] = await Promise.all([
    prisma.drinkPosSale.findMany({
      where: {
        ownerUserId,
        fulfillmentStatus: { in: ["RECEIVED", "MAKING"] },
      },
      orderBy: [{ statusUpdatedAt: "asc" }, { createdAt: "asc" }],
      take: 100,
      include: boardLineInclude,
    }),
    prisma.drinkPosSale.findMany({
      where: {
        ownerUserId,
        fulfillmentStatus: "DONE",
        statusUpdatedAt: { gte: since },
      },
      orderBy: [{ statusUpdatedAt: "desc" }],
      take: 60,
      include: boardLineInclude,
    }),
  ]);

  const byId = new Map<string, DrinkPosOrderBoardRow>();
  for (const row of [...active, ...doneToday]) {
    byId.set(row.id, mapDrinkPosOrderBoardRow(row));
  }
  return [...byId.values()];
}

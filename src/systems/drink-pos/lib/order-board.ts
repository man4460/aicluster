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
  /** สร้างก่อนเที่ยงคืน กทม. ของวันนี้ — ยังไม่ได้ส่งมอบ */
  fromPreviousDay?: boolean;
  lines: DrinkPosOrderBoardLine[];
};

export type DrinkPosOrderBoardPayload = {
  orders: DrinkPosOrderBoardRow[];
  /** จำนวนออเดอร์วันก่อนหน้าที่ยังไม่ SERVED */
  staleUnclearedCount: number;
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

export function mapDrinkPosOrderBoardRow(
  s: SaleRow,
  opts?: { since?: Date },
): DrinkPosOrderBoardRow {
  const status = (["RECEIVED", "MAKING", "DONE", "SERVED"].includes(s.fulfillmentStatus)
    ? s.fulfillmentStatus
    : "RECEIVED") as DrinkPosFulfillmentStatus;
  const since = opts?.since ?? drinkPosOrderBoardSinceDate();
  return {
    id: s.id,
    note: s.note,
    totalBaht: s.totalBaht,
    fulfillmentStatus: status,
    statusUpdatedAt: s.statusUpdatedAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    memberPhone: s.memberPhone,
    isRewardRedemption: s.isRewardRedemption,
    fromPreviousDay: s.createdAt < since,
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
 * ดึงกระดานคิว — คิวที่ยังไม่ส่งมอบ (รับ / กำลังทำ / พร้อมรับ)
 * รวม READY ของวันก่อนที่ยังไม่กดส่งมอบ — แจ้งเตือนบน UI
 * สถานะ SERVED = ส่งมอบแล้ว → ไม่อยู่บนกระดาน
 */
export async function fetchDrinkPosOrderBoardRows(ownerUserId: string): Promise<DrinkPosOrderBoardRow[]> {
  const since = drinkPosOrderBoardSinceDate();

  const [active, readyOpen] = await Promise.all([
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
      },
      orderBy: [{ statusUpdatedAt: "desc" }],
      take: 80,
      include: boardLineInclude,
    }),
  ]);

  const byId = new Map<string, DrinkPosOrderBoardRow>();
  for (const row of [...active, ...readyOpen]) {
    byId.set(row.id, mapDrinkPosOrderBoardRow(row, { since }));
  }
  return [...byId.values()];
}

export function countDrinkPosStaleUnclearedOrders(orders: DrinkPosOrderBoardRow[]): number {
  return orders.filter((o) => o.fromPreviousDay).length;
}

export async function fetchDrinkPosOrderBoardPayload(
  ownerUserId: string,
): Promise<DrinkPosOrderBoardPayload> {
  const orders = await fetchDrinkPosOrderBoardRows(ownerUserId);
  return {
    orders,
    staleUnclearedCount: countDrinkPosStaleUnclearedOrders(orders),
  };
}

import { prisma } from "@/lib/prisma";
import {
  MEDIA_REGISTRY_BORROW_OPEN_STATUSES,
  MEDIA_REGISTRY_ITEM_STATUS,
} from "@/systems/media-registry/lib/constants";
import { decString } from "@/systems/media-registry/lib/serialize";
import { syncMediaRegistryOverdueBorrows } from "@/systems/media-registry/lib/sync-overdue";

export type MediaRegistryDashboardPayload = {
  summary: {
    totalRegisterRows: number;
    totalUnits: number;
    availableUnits: number;
    borrowedUnits: number;
    overdueBorrowRecords: number;
    damagedLostDisposedTitles: number;
    valueBahtApprox: number;
  };
  categoryBars: { key: string; label: string; amount: number; pct: number }[];
  recentIssues: {
    id: string;
    recordType: string;
    mediaName: string;
    registerNo: string;
    quantityAffected: number;
    cost: string | null;
    recordDate: string;
  }[];
};

export async function loadMediaRegistryDashboard(ownerUserId: string): Promise<MediaRegistryDashboardPayload> {
  await syncMediaRegistryOverdueBorrows(ownerUserId);

  const items = await prisma.mediaRegistryItem.findMany({
    where: { ownerUserId },
    select: {
      category: true,
      quantityTotal: true,
      quantityAvailable: true,
      totalPrice: true,
      mediaStatus: true,
    },
  });

  const totalRegister = items.length;

  let totalUnits = 0;
  let availableUnits = 0;
  let valueBaht = 0;
  const byCategory = new Map<string, { count: number; units: number }>();

  for (const it of items) {
    totalUnits += it.quantityTotal;
    availableUnits += it.quantityAvailable;
    valueBaht += Number(it.totalPrice);
    const cur = byCategory.get(it.category) ?? { count: 0, units: 0 };
    cur.count += 1;
    cur.units += it.quantityTotal;
    byCategory.set(it.category, cur);
  }

  const activeBorrows = await prisma.mediaRegistryBorrow.findMany({
    where: { ownerUserId, borrowStatus: { in: MEDIA_REGISTRY_BORROW_OPEN_STATUSES } },
    select: { quantityBorrow: true, quantityReturn: true },
  });
  let borrowedUnits = 0;
  for (const b of activeBorrows) {
    borrowedUnits += b.quantityBorrow - b.quantityReturn;
  }

  const overdueCount = await prisma.mediaRegistryBorrow.count({
    where: { ownerUserId, borrowStatus: "เกินกำหนด" },
  });

  const damagedLostDisposed = await prisma.mediaRegistryItem.count({
    where: {
      ownerUserId,
      mediaStatus: {
        in: [
          MEDIA_REGISTRY_ITEM_STATUS.DAMAGED,
          MEDIA_REGISTRY_ITEM_STATUS.LOST,
          MEDIA_REGISTRY_ITEM_STATUS.DISPOSED,
        ],
      },
    },
  });

  const recentIssuesRaw = await prisma.mediaRegistryIssue.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { media: { select: { registerNo: true } } },
  });

  const maxCat = Math.max(...[...byCategory.values()].map((c) => c.units), 1);
  const categoryBars = [...byCategory.entries()]
    .map(([label, v]) => ({
      key: label,
      label: `${label} · ${v.units} ชิ้น`,
      amount: v.units,
      pct: maxCat > 0 ? (v.units / maxCat) * 100 : 0,
    }))
      .sort((a, b) => b.amount - a.amount);

  return {
    summary: {
      totalRegisterRows: totalRegister,
      totalUnits,
      availableUnits,
      borrowedUnits,
      overdueBorrowRecords: overdueCount,
      damagedLostDisposedTitles: damagedLostDisposed,
      valueBahtApprox: Math.round(valueBaht * 100) / 100,
    },
    categoryBars,
    recentIssues: recentIssuesRaw.map((r) => ({
      id: r.id,
      recordType: r.recordType,
      mediaName: r.mediaName,
      registerNo: r.media.registerNo,
      quantityAffected: r.quantityAffected,
      cost: decString(r.cost),
      recordDate: r.recordDate.toISOString(),
    })),
  };
}

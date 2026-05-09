import { prisma } from "@/lib/prisma";
import { MEDIA_REGISTRY_BORROW_STATUS } from "@/systems/media-registry/lib/constants";
import { isBorrowPastDue } from "@/systems/media-registry/lib/status";

/** อัปเดตสถานะเกินกำหนดก่อนแสดงรายการยืม */
export async function syncMediaRegistryOverdueBorrows(ownerUserId: string): Promise<void> {
  const rows = await prisma.mediaRegistryBorrow.findMany({
    where: {
      ownerUserId,
      borrowStatus: {
        in: [
          MEDIA_REGISTRY_BORROW_STATUS.ACTIVE,
          MEDIA_REGISTRY_BORROW_STATUS.PARTIAL,
          MEDIA_REGISTRY_BORROW_STATUS.OVERDUE,
        ],
      },
    },
    select: { id: true, dueDate: true, borrowStatus: true },
  });
  const toOverdue = rows.filter((r) => isBorrowPastDue(r.dueDate, r.borrowStatus));
  if (toOverdue.length === 0) return;
  await prisma.mediaRegistryBorrow.updateMany({
    where: {
      id: { in: toOverdue.map((r) => r.id) },
      borrowStatus: { not: MEDIA_REGISTRY_BORROW_STATUS.RETURNED },
    },
    data: { borrowStatus: MEDIA_REGISTRY_BORROW_STATUS.OVERDUE },
  });
}

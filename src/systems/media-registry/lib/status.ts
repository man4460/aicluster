import { bangkokDateKey, isBangkokDateBefore } from "@/lib/time/bangkok";
import { MEDIA_REGISTRY_BORROW_STATUS } from "@/systems/media-registry/lib/constants";

const TERMINAL_ITEM = new Set(["ชำรุด", "สูญหาย", "จำหน่าย"]);

export function recalcMediaItemStatus(row: {
  quantityAvailable: number;
  quantityTotal: number;
  mediaStatus: string;
}): string {
  if (TERMINAL_ITEM.has(row.mediaStatus)) return row.mediaStatus;
  if (row.quantityTotal <= 0) return row.mediaStatus;
  if (row.quantityAvailable <= 0) return "ถูกยืม";
  if (row.quantityAvailable < row.quantityTotal) return "ถูกยืม";
  return "พร้อมใช้งาน";
}

export function dueDateKeyBangkok(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/** true เมื่อครบกำหนดคืนแล้ว (Bangkok วันนี้เลยกำหนด) */
export function isBorrowPastDue(dueDate: Date | null, borrowStatus: string): boolean {
  if (borrowStatus === MEDIA_REGISTRY_BORROW_STATUS.RETURNED) return false;
  if (!dueDate) return false;
  const dueKey = dueDateKeyBangkok(dueDate);
  return isBangkokDateBefore(dueKey, bangkokDateKey());
}

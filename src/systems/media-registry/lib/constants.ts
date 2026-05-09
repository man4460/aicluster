/** สถานะรายการสื่อ (ตรง media_system) */
export const MEDIA_REGISTRY_ITEM_STATUS = {
  AVAILABLE: "พร้อมใช้งาน",
  ON_LOAN: "ถูกยืม",
  DAMAGED: "ชำรุด",
  LOST: "สูญหาย",
  DISPOSED: "จำหน่าย",
} as const;

export type MediaRegistryItemStatus =
  (typeof MEDIA_REGISTRY_ITEM_STATUS)[keyof typeof MEDIA_REGISTRY_ITEM_STATUS];

/** สถานะการยืม */
export const MEDIA_REGISTRY_BORROW_STATUS = {
  ACTIVE: "กำลังยืม",
  PARTIAL: "คืนบางส่วน",
  RETURNED: "คืนแล้ว",
  OVERDUE: "เกินกำหนด",
} as const;

/** บันทึกปัญหา/ซ่อม */
export const MEDIA_REGISTRY_ISSUE_TYPE = {
  DAMAGED: "ชำรุด",
  REPAIR: "ซ่อมบำรุง",
  LOST: "สูญหาย",
  DISPOSED: "จำหน่าย",
} as const;

/** ยืมที่ยังไม่ปิด (ลบสื่อไม่ได้) */
export const MEDIA_REGISTRY_BORROW_OPEN_STATUSES: string[] = [
  MEDIA_REGISTRY_BORROW_STATUS.ACTIVE,
  MEDIA_REGISTRY_BORROW_STATUS.PARTIAL,
  MEDIA_REGISTRY_BORROW_STATUS.OVERDUE,
];

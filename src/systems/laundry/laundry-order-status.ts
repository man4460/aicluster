/** สถานะออเดอร์ซักผ้า — โมดูลนี้ไม่มี `"use client"` เพื่อให้ API / lib import ได้โดยไม่ได้รับ proxy จาก client bundle */

export type LaundryOrderStatus =
  | "PENDING_PICKUP"
  | "PICKED_UP"
  | "SORTING"
  | "WASHING"
  | "DRYING"
  | "IRONING"
  | "READY_TO_DELIVER"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export const LAUNDRY_ORDER_STATUSES: LaundryOrderStatus[] = [
  "PENDING_PICKUP",
  "PICKED_UP",
  "SORTING",
  "WASHING",
  "DRYING",
  "IRONING",
  "READY_TO_DELIVER",
  "DELIVERING",
  "COMPLETED",
  "CANCELLED",
];

/** สถานะที่ลูกค้าถือว่าคำขอจบแล้ว — พอร์ทัลจึงเปิดให้เลือกแพ็กเกจใหม่ได้ */
export function isTerminalLaundryOrderStatus(status: string | undefined): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

/** ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และไคลเอนต์ */
export function laundryOrderStatusLabelTh(status: LaundryOrderStatus): string {
  switch (status) {
    case "PENDING_PICKUP":
      return "รอรับผ้า";
    case "PICKED_UP":
      return "รับผ้าแล้ว";
    case "SORTING":
      return "คัดแยกผ้า";
    case "WASHING":
      return "กำลังซัก";
    case "DRYING":
      return "กำลังอบ/ตาก";
    case "IRONING":
      return "กำลังรีด/พับ";
    case "READY_TO_DELIVER":
      return "พร้อมส่งคืน";
    case "DELIVERING":
      return "กำลังส่งคืน";
    case "COMPLETED":
      return "ส่งคืนสำเร็จ";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return status;
  }
}

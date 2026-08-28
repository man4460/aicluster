/** สถานะ Split Bill ที่ยังเรียกเก็บ / แนบสลิป / พิมพ์ใบแจ้งหนี้ได้ */
export const DORM_UNPAID_PAYMENT_STATUSES = ["PENDING", "OVERDUE"] as const;

export type DormUnpaidPaymentStatus = (typeof DORM_UNPAID_PAYMENT_STATUSES)[number];

export function isDormUnpaidPaymentStatus(
  s: string | null | undefined,
): s is DormUnpaidPaymentStatus {
  return s === "PENDING" || s === "OVERDUE";
}

/** ใช้ใน Prisma `where` */
export function dormUnpaidPaymentStatusFilter() {
  return { paymentStatus: { in: [...DORM_UNPAID_PAYMENT_STATUSES] } };
}

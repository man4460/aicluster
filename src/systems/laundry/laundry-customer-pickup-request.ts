/** ค่าที่บันทึกใน `recorded_by_name` เมื่อลูกค้าส่งคำขอรับผ้าที่บ้านผ่านลิงก์สาธารณะ — ต้องตรงกับ `pickup-request` API */

export const LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR = "ลูกค้า (QR)" as const;

export function isLaundryOrderFromCustomerPickupPortal(recordedByName: string | null | undefined): boolean {
  return (recordedByName ?? "").trim() === LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR;
}

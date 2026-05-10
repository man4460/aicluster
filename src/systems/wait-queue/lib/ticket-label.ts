/** เลขคิวแสดง/บันทึก — ตัวเลขล้วน 3 หลัก (เช่น 006) ไม่มีอักษรนำ */
export function formatWaitQueueTicketDisplay(seq: number): string {
  return String(seq).padStart(3, "0");
}

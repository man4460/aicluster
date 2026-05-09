/**
 * @deprecated ใช้ `applyModuleDailyTokenDeduction` (per-module) แทน
 *
 * เดิม: สายรายวัน (DAILY) หัก 1 โทเคน/วัน Bangkok ตอนเข้าแดชบอร์ดหลัก
 * ปัจจุบัน: หักเป็น **1 โทเคน/โมดูล/วัน** เมื่อผู้ใช้เข้าโมดูลกลุ่ม 1 จริง ๆ
 *           (ดู src/lib/tokens/module-daily-deduction.ts + src/lib/modules/guard.ts)
 *
 * คงฟังก์ชันนี้เป็น no-op ไว้เพื่อ backward compat (ถ้ามีโค้ดเก่าเรียกอยู่)
 */
export async function applyDailyTokenDeduction(_userId: string): Promise<void> {
  return;
}

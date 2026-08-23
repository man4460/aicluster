import { applyModuleMonthly199Billing } from "@/lib/tokens/module-monthly-199";

/**
 * เดิม: หักแพ็กเหมาทั้งบัญชี — เลิกใช้แล้ว
 * ตอนนี้แปลง BUFFET เก่าเป็นแพ็ก 199 ต่อโมดูล แล้วหัก 199/โมดูล/เดือน
 */
export async function applyBuffetMonthlyBilling(userId: string): Promise<void> {
  await applyModuleMonthly199Billing(userId);
}

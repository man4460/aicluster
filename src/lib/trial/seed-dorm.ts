import type { PrismaClient } from "@/generated/prisma/client";
import { ensureDormitoryDemoFinanceData } from "@/lib/dormitory/ensure-dormitory-demo-finance-data";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** ข้อมูลตัวอย่างหอพัก — ห้อง + รายรับ/รายจ่าย 12 เดือนย้อนหลัง */
export async function seedDormitoryTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await ensureDormitoryDemoFinanceData(tx, ownerUserId, trialSessionId, {
    months: 12,
    fillMissingOnly: false,
  });
}

/**
 * ข้อมูล demo prod สำหรับบัญชี demo — เติมครั้งแรก หรือเติมเดือนที่ขาดทุกครั้งที่ refresh
 * @param opts.refreshMonthly — เติมเดือนที่ยังไม่มี (ค่าเริ่ม true)
 */
export async function seedDormitoryProdDemoForOwner(
  db: PrismaClient,
  ownerUserId: string,
  opts?: { refreshMonthly?: boolean },
): Promise<void> {
  const refresh = opts?.refreshMonthly !== false;
  const existing = await db.dormitoryProfile.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    select: { id: true },
  });

  if (!existing) {
    await db.$transaction((tx) =>
      ensureDormitoryDemoFinanceData(tx, ownerUserId, TRIAL_PROD_SCOPE, {
        months: 12,
        fillMissingOnly: false,
      }),
    );
    return;
  }

  if (refresh) {
    await ensureDormitoryDemoFinanceData(db, ownerUserId, TRIAL_PROD_SCOPE, {
      months: 12,
      fillMissingOnly: true,
    });
  }
}

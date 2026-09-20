/**
 * รีเฟรชข้อมูลตัวอย่างโมดูลจุดตรวจ รปภ. ให้บัญชี demo
 * รัน: npx tsx scripts/seed-smart-guard-tour-demo.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_OWNER_EMAILS } from "../src/lib/trial/run-demo-refresh";
import { seedAttendanceProdDemoForOwner } from "../src/lib/trial/seed-attendance";
import { seedSmartGuardTourProdDemoForOwner } from "../src/lib/trial/seed-smart-guard-tour";
import { SMART_GUARD_TOUR_MODULE_SLUG } from "../src/lib/modules/config";
import { subscribeModule } from "../src/lib/modules/subscriptions-store";
import { TRIAL_PROD_SCOPE } from "../src/lib/trial/constants";

const prisma = new PrismaClient();

async function main() {
  const mod = await prisma.appModule.findUnique({
    where: { slug: SMART_GUARD_TOUR_MODULE_SLUG },
    select: { id: true },
  });
  if (!mod) {
    console.error("ไม่พบโมดูล smart-guard-tour ใน app_modules — รัน db:seed ก่อน");
    process.exit(1);
  }

  for (const email of DEMO_OWNER_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      console.warn(`ข้าม ${email}: ไม่พบ user`);
      continue;
    }
    console.log(`→ ${email}`);
    await subscribeModule(user.id, mod.id).catch(() => undefined);
    await seedAttendanceProdDemoForOwner(prisma, user.id).catch((e) =>
      console.warn("  attendance:", e instanceof Error ? e.message : e),
    );
    await seedSmartGuardTourProdDemoForOwner(prisma, user.id, { refresh: true });

    const shop = await prisma.smartGuardShop.findFirst({
      where: { ownerUserId: user.id, trialSessionId: TRIAL_PROD_SCOPE },
      select: { id: true, displayName: true },
    });
    if (!shop) {
      console.warn("  ไม่มี shop หลัง seed");
      continue;
    }
    const [cp, staff, tours, shifts, inc, ledger, links] = await Promise.all([
      prisma.smartGuardCheckpoint.count({ where: { shopId: shop.id } }),
      prisma.smartGuardStaff.count({ where: { shopId: shop.id } }),
      prisma.smartGuardTourLog.count({ where: { shopId: shop.id } }),
      prisma.smartGuardShiftLog.count({ where: { shopId: shop.id } }),
      prisma.smartGuardIncident.count({ where: { shopId: shop.id } }),
      prisma.smartGuardLedgerEntry.count({ where: { shopId: shop.id } }),
      prisma.smartGuardAttendanceStaffLink.count({ where: { shopId: shop.id } }),
    ]);
    console.log(
      `  ✓ ${shop.displayName} — จุด ${cp} · พนง ${staff} · สายตรวจ ${tours} · กะ ${shifts} · เหตุ ${inc} · เงิน ${ledger} · ลิงก์เช็คอิน ${links}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

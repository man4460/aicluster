/**
 * ใส่ข้อมูลตัวอย่างรายรับ–รายจ่ายให้บัญชี user demo เท่านั้น
 * รัน: npx tsx scripts/seed-home-finance-user-demo.ts
 */
import { prisma } from "@/lib/prisma";
import { seedHomeFinanceProdDemoForOwner } from "@/lib/trial/seed-home-finance";
import { subscribeModule } from "@/lib/modules/subscriptions-store";
import { HOME_FINANCE_BASIC_MODULE_SLUG } from "@/lib/modules/config";

const USER_EMAILS = ["user@mawell.local", "user@mawell.local.com"] as const;

async function main() {
  const mod = await prisma.appModule.findUnique({
    where: { slug: HOME_FINANCE_BASIC_MODULE_SLUG },
    select: { id: true },
  });
  if (!mod) {
    console.error("ไม่พบโมดูลรายรับ–รายจ่ายใน app_module");
    process.exitCode = 1;
    return;
  }

  for (const email of USER_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!user) {
      console.log(`ข้าม — ไม่พบ ${email}`);
      continue;
    }
    await subscribeModule(user.id, mod.id);
    await seedHomeFinanceProdDemoForOwner(prisma, user.id);
    const counts = await prisma.$transaction([
      prisma.homeFinanceCategory.count({ where: { ownerUserId: user.id, isActive: true } }),
      prisma.homeFinanceEntry.count({ where: { ownerUserId: user.id } }),
      prisma.homeFinanceReminder.count({ where: { ownerUserId: user.id } }),
      prisma.homeFinancePersonalDocument.count({ where: { ownerUserId: user.id } }),
    ]);
    console.log(
      `OK ${email} — หมวด ${counts[0]} · รายการ ${counts[1]} · แจ้งเตือน ${counts[2]} · เอกสาร ${counts[3]}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

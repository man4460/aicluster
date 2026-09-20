import { prisma } from "../src/lib/prisma";
import {
  seedLaundryDemoForAllSubscribers,
  seedLaundryProdDemoForOwner,
} from "../src/lib/trial/seed-mqtt-laundry";

/** เฉพาะบัญชี demo — ไม่ใส่แอดมิน (seed-demo-data-skip-admin) */
const DEMO_EMAILS = ["user@mawell.local.com", "user@mawell.local"] as const;

async function main() {
  const subscribed = await seedLaundryDemoForAllSubscribers(prisma);
  console.log(`Seeded laundry demo for ${subscribed} subscribed user(s)`);

  for (const email of DEMO_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!user) {
      console.warn(`Skip — user not found: ${email}`);
      continue;
    }
    await seedLaundryProdDemoForOwner(prisma, user.id);
    const ord = await prisma.laundryOrder.count({
      where: { ownerUserId: user.id, trialSessionId: "prod" },
    });
    console.log(`  ${user.email}: prod orders=${ord}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

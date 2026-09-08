/**
 * ใส่สลิปตัวอย่างในชมรม — ค่าบำรุง + คำตอบกิจกรรม/ลิงก์ + รายการการเงิน
 */
import { prisma } from "../src/lib/prisma";
import { DEMO_CLUB_EVENT_SLIP_URL } from "../src/lib/trial/demo-module-settings";
import { ensureDemoPaymentSlipFiles } from "../src/lib/trial/demo-payment-slip";

const DEMO_EMAILS = ["user@mawell.local", "user@mawell.local.com"] as const;
const CLUB = DEMO_CLUB_EVENT_SLIP_URL;

async function main() {
  const src = await ensureDemoPaymentSlipFiles();
  console.log("slip file", src, "→", CLUB);

  const users = await prisma.user.findMany({
    where: { email: { in: [...DEMO_EMAILS] } },
    select: { id: true, email: true },
  });

  for (const u of users) {
    const dues = await prisma.clubEventDuesPayment.updateMany({
      where: { ownerUserId: u.id },
      data: { slipUrl: CLUB },
    });
    const subsWithPay = await prisma.clubEventLinkSubmission.updateMany({
      where: {
        ownerUserId: u.id,
        OR: [
          { slipUrl: { not: null } },
          { paymentMethod: { in: ["PROMPTPAY", "TRANSFER"] } },
          { amountBaht: { gt: 0 } },
        ],
      },
      data: { slipUrl: CLUB },
    });
    const fin = await prisma.clubEventFinanceTransaction.updateMany({
      where: {
        ownerUserId: u.id,
        OR: [{ slipUrl: { not: null } }, { type: "INCOME" }],
      },
      data: { slipUrl: CLUB },
    });
    console.log(u.email, { dues: dues.count, submissions: subsWithPay.count, finance: fin.count });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

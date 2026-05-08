import { prisma } from "@/lib/prisma";

const TARGET_EMAILS = [
  "admin@mawell.local",
  "user@mawell.local",
  "user@mawell.local.com",
] as const;

const TRIAL_SESSION_ID = "prod";

const SLIP_PHOTOS = [
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/ReceiptSwiss.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/3/3a/Credit_card_receipt.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Shopping_receipt%2C_Taiwan.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/94/Receipt_01.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f9/Kassenzettel.jpg",
] as const;

type SlipPlan = {
  yearMonth: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
};

const SLIP_PLANS: readonly SlipPlan[] = [
  {
    yearMonth: "2026-01",
    amount: 1000,
    status: "APPROVED",
    submittedAt: "2026-01-06T09:15:00+07:00",
    reviewedAt: "2026-01-06T10:20:00+07:00",
    reviewerNote: "ตรวจแล้ว ยอดตรง",
  },
  {
    yearMonth: "2026-01",
    amount: 950,
    status: "REJECTED",
    submittedAt: "2026-01-09T19:10:00+07:00",
    reviewedAt: "2026-01-10T08:40:00+07:00",
    reviewerNote: "ยอดไม่ตรงบิล กรุณาแนบใหม่",
  },
  {
    yearMonth: "2026-02",
    amount: 1200,
    status: "APPROVED",
    submittedAt: "2026-02-08T20:30:00+07:00",
    reviewedAt: "2026-02-08T21:05:00+07:00",
    reviewerNote: "อนุมัติเรียบร้อย",
  },
  {
    yearMonth: "2026-03",
    amount: 900,
    status: "PENDING",
    submittedAt: "2026-03-07T14:25:00+07:00",
  },
  {
    yearMonth: "2026-03",
    amount: 1500,
    status: "PENDING",
    submittedAt: "2026-03-12T11:00:00+07:00",
  },
];

async function seedForUser(ownerUserId: string, email: string) {
  const houses = await prisma.villageHouse.findMany({
    where: {
      ownerUserId,
      trialSessionId: TRIAL_SESSION_ID,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, houseNo: true },
    take: 3,
  });

  if (houses.length === 0) {
    console.log(`Skip ${email}: no village houses`);
    return;
  }

  for (let i = 0; i < SLIP_PLANS.length; i += 1) {
    const plan = SLIP_PLANS[i];
    const house = houses[i % houses.length];
    const photoUrl = SLIP_PHOTOS[i];

    const feeRow = await prisma.villageCommonFeeRow.findFirst({
      where: {
        ownerUserId,
        trialSessionId: TRIAL_SESSION_ID,
        houseId: house.id,
        yearMonth: plan.yearMonth,
      },
      orderBy: { id: "asc" },
      select: { id: true },
    });

    const existed = await prisma.villageSlipSubmission.findFirst({
      where: {
        ownerUserId,
        trialSessionId: TRIAL_SESSION_ID,
        houseId: house.id,
        yearMonth: plan.yearMonth,
        amount: plan.amount,
        slipImageUrl: photoUrl,
      },
      select: { id: true },
    });
    if (existed) continue;

    await prisma.villageSlipSubmission.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_SESSION_ID,
        houseId: house.id,
        feeRowId: feeRow?.id ?? null,
        yearMonth: plan.yearMonth,
        amount: plan.amount,
        slipImageUrl: photoUrl,
        status: plan.status,
        reviewerNote: plan.reviewerNote ?? null,
        submittedAt: new Date(plan.submittedAt),
        reviewedAt: plan.reviewedAt ? new Date(plan.reviewedAt) : null,
      },
    });
  }

  console.log(`Seeded 5 demo slips for ${email}`);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...TARGET_EMAILS] } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("No target demo users found.");
    return;
  }

  for (const user of users) {
    await seedForUser(user.id, user.email ?? "(unknown)");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { prisma } from "../src/lib/prisma";

async function main() {
  const u = await prisma.user.findFirst({
    where: { email: "user@mawell.local" },
    select: { id: true, email: true },
  });
  if (!u) {
    console.log("no user");
    return;
  }
  const orders = await prisma.ecommerceOrder.findMany({
    where: { store: { ownerUserId: u.id }, NOT: { paymentSlipUrl: null } },
    select: { paymentSlipUrl: true, referenceCode: true, status: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
  const hf = await prisma.homeFinanceEntry.findMany({
    where: { ownerUserId: u.id, NOT: { slipImageUrl: null } },
    select: { slipImageUrl: true, title: true },
    take: 5,
  });
  const village = await prisma.villageSlipSubmission.findMany({
    where: { ownerUserId: u.id },
    select: { slipImageUrl: true, status: true },
    take: 5,
  });
  const hotel = await prisma.hotelResortBooking.findMany({
    where: { ownerUserId: u.id },
    select: { paymentSlipUrl: true, depositSlipUrl: true, paymentMethod: true },
    take: 5,
  });
  console.log(JSON.stringify({ email: u.email, orders, hf, village, hotel }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedEcommerceStoreProdDemoForOwner } from "../src/lib/trial/seed-ecommerce-store";

const prisma = new PrismaClient();
const emails = ["user@mawell.local.com", "user@mawell.local"] as const;

async function main() {
  for (const email of emails) {
    const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!row) {
      console.log("skip", email);
      continue;
    }
    await seedEcommerceStoreProdDemoForOwner(prisma, row.id);
    const store = await prisma.ecommerceStore.findFirst({
      where: { ownerUserId: row.id, trialSessionId: "prod" },
      include: {
        _count: { select: { products: true, orders: true, buyerCustomers: true, categories: true } },
      },
    });
    const costs = await prisma.ecommerceCostEntry.count({ where: { ownerUserId: row.id } });
    console.log(email, {
      products: store?._count.products,
      orders: store?._count.orders,
      buyers: store?._count.buyerCustomers,
      cats: store?._count.categories,
      costs,
    });
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

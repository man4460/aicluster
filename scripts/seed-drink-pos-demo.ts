import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDrinkPosProdDemoForOwner } from "../src/lib/trial/seed-drink-pos";

const prisma = new PrismaClient();

async function main() {
  const emails = ["admin@mawell.local", "user@mawell.local.com", "user@mawell.local"] as const;
  for (const email of emails) {
    const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!row) {
      console.log(`skip missing ${email}`);
      continue;
    }
    await seedDrinkPosProdDemoForOwner(prisma, row.id);
    console.log(`seeded drink-pos for ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

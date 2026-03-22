import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@mawell.local" },
    update: {
      passwordHash: adminHash,
      role: "ADMIN",
    },
    create: {
      email: "admin@mawell.local",
      username: "admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const userHash = await bcrypt.hash("User123!", 12);
  await prisma.user.upsert({
    where: { email: "user@mawell.local" },
    update: {
      passwordHash: userHash,
      role: "USER",
    },
    create: {
      email: "user@mawell.local",
      username: "user",
      passwordHash: userHash,
      role: "USER",
    },
  });
}

main()
  .then(() => {
    console.log("Seed OK — admin / Admin123! , user / User123!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

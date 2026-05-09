import { prisma } from "@/lib/prisma";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@mawell.local" },
    select: { id: true, email: true },
  });
  if (!user) {
    console.log("admin@mawell.local not found");
    return;
  }

  const entries = await prisma.homeFinanceEntry.findMany({
    where: { ownerUserId: user.id },
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      slipImageUrl: true,
      attachmentUrls: true,
    },
  });

  console.log(JSON.stringify({ user: user.email, entries }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { prisma } from "@/lib/prisma";

const BAD_FRAGMENTS = ["1556670423", "1461023058943", "ccb23c51", "8fe44f7ec842"];

async function main() {
  const u = await prisma.user.findFirst({
    where: { email: "user@mawell.local" },
    select: { id: true },
  });
  if (!u) {
    console.log("user not found");
    process.exit(1);
  }

  const [cats, prods] = await Promise.all([
    prisma.drinkPosCategory.findMany({
      where: { ownerUserId: u.id },
      select: { name: true, imageUrl: true },
    }),
    prisma.drinkPosProduct.findMany({
      where: { ownerUserId: u.id },
      select: { name: true, imageUrl: true },
    }),
  ]);

  const rows = [...cats, ...prods];
  let bad = 0;
  for (const row of rows) {
    const flag = BAD_FRAGMENTS.some((f) => row.imageUrl?.includes(f)) ? "OLD_404" : "seed_ok";
    if (flag === "OLD_404") bad++;
    console.log(flag, row.name, row.imageUrl?.split("/photo-")[1]?.slice(0, 36) ?? "(none)");
  }
  console.log(
    "---",
    bad ? `${bad} still old URLs` : `all ${rows.length} rows use verified seed URLs`,
  );
  process.exit(bad ? 1 : 0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

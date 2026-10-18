/**
 * ซิงก์คลังข้อหาระบบจาก charge-catalog-seed
 * รัน: npx tsx scripts/sync-smart-police-charges.ts
 */
import { ensureSmartPoliceBuiltinCharges } from "../src/lib/smart-police/api-owner";
import { SMART_POLICE_BUILTIN_CHARGES } from "../src/lib/smart-police/charge-catalog-seed";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("seed count", SMART_POLICE_BUILTIN_CHARGES.length);
  await ensureSmartPoliceBuiltinCharges();
  const total = await prisma.smartPoliceCharge.count({
    where: { isBuiltin: true, ownerUserId: null },
  });
  const byCat = await prisma.smartPoliceCharge.groupBy({
    by: ["category"],
    where: { isBuiltin: true, ownerUserId: null },
    _count: true,
    orderBy: { category: "asc" },
  });
  console.log("builtin total", total);
  for (const row of byCat) {
    console.log(`  ${row.category}: ${row._count}`);
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

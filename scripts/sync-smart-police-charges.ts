/**
 * ซิงก์คลังข้อหาระบบต่อสถานีจาก charge-catalog-seed
 * รัน: npx tsx scripts/sync-smart-police-charges.ts
 */
import { ensureSmartPoliceBuiltinCharges } from "../src/lib/smart-police/api-owner";
import { SMART_POLICE_BUILTIN_CHARGES } from "../src/lib/smart-police/charge-catalog-seed";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("seed count", SMART_POLICE_BUILTIN_CHARGES.length);
  const profiles = await prisma.smartPoliceProfile.findMany({
    select: { ownerUserId: true, stationName: true },
  });
  console.log("stations", profiles.length);
  for (const p of profiles) {
    await ensureSmartPoliceBuiltinCharges(p.ownerUserId);
    const total = await prisma.smartPoliceCharge.count({
      where: { ownerUserId: p.ownerUserId, isBuiltin: true },
    });
    console.log(`  ${p.stationName} (${p.ownerUserId.slice(0, 8)}…): builtin ${total}`);
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

/**
 * Regression check: multi attachment paths on home_vehicle_profiles (same path as PATCH + client normalize).
 * Run: npm run verify:hf-vehicle-attachments
 * Restores previous attachment_urls after test.
 */
import "dotenv/config";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import {
  canonicalizeHomeFinanceAttachmentList,
  normalizeVehicleAttachmentUrls,
} from "../src/lib/home-finance/attachments";

const prisma = new PrismaClient();

async function main() {
  const v = await prisma.homeVehicleProfile.findFirst({ orderBy: { id: "asc" } });
  if (!v) {
    console.error("FAIL: no row in home_vehicle_profiles — create a vehicle in UI or seed DB first.");
    process.exit(1);
  }

  const three = canonicalizeHomeFinanceAttachmentList([
    "/uploads/home-finance/e2e-a.pdf",
    "/uploads/home-finance/e2e-b.pdf",
    "/uploads/home-finance/e2e-c.pdf",
  ]);
  if (three.length !== 3) {
    console.error("FAIL: canonicalizeHomeFinanceAttachmentList should keep 3 valid paths");
    process.exit(1);
  }

  const before = v.attachmentUrls;

  await prisma.homeVehicleProfile.update({
    where: { id: v.id },
    data: { attachmentUrls: three as Prisma.InputJsonValue },
  });

  const row = await prisma.homeVehicleProfile.findUnique({ where: { id: v.id } });
  if (!row) {
    console.error("FAIL: row missing after update");
    process.exit(1);
  }

  const normalized = normalizeVehicleAttachmentUrls(row);
  const ok =
    normalized.length === 3 &&
    normalized[0] === three[0] &&
    normalized[1] === three[1] &&
    normalized[2] === three[2];

  await prisma.homeVehicleProfile.update({
    where: { id: v.id },
    data: {
      attachmentUrls:
        before === null || before === undefined
          ? Prisma.JsonNull
          : (before as Prisma.InputJsonValue),
    },
  });

  if (!ok) {
    console.error("FAIL: normalizeVehicleAttachmentUrls after DB read:", normalized);
    process.exit(1);
  }

  console.log(
    "OK: verify-home-finance-vehicle-attachments-db — 3 paths persisted + normalizeVehicleAttachmentUrls; restored previous value.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

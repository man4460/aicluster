/**
 * Upsert โมดูลใน module_list ที่ยังไม่มีใน DB (เช่น pro-resume / club-event / lms)
 * รัน: npx tsx scripts/upsert-missing-app-modules.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const MISSING_MODULE_SEEDS = [
  {
    slug: "club-event",
    title: "บริหารชมรม",
    description:
      "กลุ่ม 1 (Basic) — กิจกรรม สมาชิก การเงิน ทรัพย์สิน และเว็บสาธารณะ /club/[slug]",
    groupId: 1,
    sortOrder: 36,
  },
  {
    slug: "pro-resume",
    title: "Pro Resume & Portfolio Builder",
    description:
      "กลุ่ม 1 (Basic) — เรซูเม่ ประวัติ ผลงาน และเว็บสาธารณะ /resume/[slug]",
    groupId: 1,
    sortOrder: 37,
  },
  {
    slug: "lms",
    title: "LMS คอร์สออนไลน์",
    description:
      "กลุ่ม 1 (Basic) — คอร์ส บทเรียน YouTube ข้อสอบ นักเรียน (โควตา 10) และเว็บ /lms/[slug]",
    groupId: 1,
    sortOrder: 38,
  },
] as const;

async function main() {
  for (const m of MISSING_MODULE_SEEDS) {
    const row = await prisma.appModule.upsert({
      where: { slug: m.slug },
      update: {
        title: m.title,
        description: m.description,
        groupId: m.groupId,
        sortOrder: m.sortOrder,
        isActive: true,
      },
      create: {
        slug: m.slug,
        title: m.title,
        description: m.description,
        groupId: m.groupId,
        sortOrder: m.sortOrder,
        isActive: true,
      },
    });
    console.log("upserted", row.slug, row.id);
  }

  const check = await prisma.appModule.findMany({
    where: { slug: { in: MISSING_MODULE_SEEDS.map((m) => m.slug) } },
    select: { slug: true, title: true, isActive: true, groupId: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("verified", check);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

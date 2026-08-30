/**
 * เติม/รีเฟรชข้อมูลตัวอย่างทุกโมดูลให้บัญชี user ทดลอง
 * — โมดูลแดชบอร์ดรายวัน (โรงแรม · คาร์แคร์ · คิว · สนาม ฯลฯ) ตามวันนี้ (Asia/Bangkok)
 *
 * รัน: npm run seed:demo-refresh
 * หรือ cron: GET/POST /api/cron/demo-refresh
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { runDemoRefreshForOwners } from "../src/lib/trial/run-demo-refresh";

const prisma = new PrismaClient();

async function main() {
  await runDemoRefreshForOwners(prisma, { log: (m) => console.log(m) });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

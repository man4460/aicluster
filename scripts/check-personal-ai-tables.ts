/**
 * ตรวจว่าตารางแชท AI ส่วนตัวมีใน MySQL หรือไม่
 * รัน: npx tsx scripts/check-personal-ai-tables.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = ["chat_sessions", "chat_messages", "chat_mavel_slip_pending"] as const;
  for (const t of tables) {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
        `SELECT COUNT(*) AS c FROM \`${t}\` LIMIT 1`,
      );
      console.log(`OK  ${t}: rows = ${String(rows[0]?.c ?? "?")}`);
    } catch (e) {
      console.error(`FAIL ${t}:`, e instanceof Error ? e.message : e);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

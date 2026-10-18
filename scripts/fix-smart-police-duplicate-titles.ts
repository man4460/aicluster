/**
 * แก้ชื่อเรื่องที่ถูกคัดลอกจากข้อหาเต็ม (บั๊กเก่า)
 * รัน: npx tsx scripts/fix-smart-police-duplicate-titles.ts
 */
import { prisma } from "../src/lib/prisma";

function shortTitle(charge: string): string {
  const t = charge.trim();
  const m = t.match(/^(.+?)(?:\s+ตาม|\s+พ\.ร\.บ|\s+มาตรา)/);
  if (m?.[1] && m[1].trim().length >= 2 && m[1].trim().length <= 60) {
    return m[1].trim();
  }
  if (t.length <= 40) return t;
  return `${t.slice(0, 40).trim()}…`;
}

async function main() {
  const rows = await prisma.smartPoliceCase.findMany({
    select: { id: true, title: true, chargeText: true, caseNumber: true },
  });
  let n = 0;
  for (const r of rows) {
    const charge = (r.chargeText ?? "").trim();
    if (!charge) continue;
    if (r.title.trim() !== charge) continue;
    const next = shortTitle(charge);
    if (next === r.title.trim()) continue;
    await prisma.smartPoliceCase.update({ where: { id: r.id }, data: { title: next } });
    console.log(`${r.caseNumber}: ${next}`);
    n += 1;
  }
  console.log("updated", n);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

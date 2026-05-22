import type { PrismaClient } from "@/generated/prisma/client";

/** ปี พ.ศ. สำหรับเลขคดี */
export function thaiBuddhistYear(d = new Date()): number {
  return d.getFullYear() + 543;
}

/** สร้างเลขคดีถัดไป เช่น ส.2568/0001 */
export async function nextSmartPoliceCaseNumber(
  prisma: PrismaClient,
  ownerUserId: string,
  prefix: string,
): Promise<string> {
  const year = thaiBuddhistYear();
  const stem = `${prefix.trim() || "ส."}${year}/`;
  const rows = await prisma.smartPoliceCase.findMany({
    where: {
      ownerUserId,
      caseNumber: { startsWith: stem },
    },
    select: { caseNumber: true },
    orderBy: { caseNumber: "desc" },
    take: 50,
  });
  let max = 0;
  for (const r of rows) {
    const tail = r.caseNumber.slice(stem.length);
    const n = parseInt(tail.replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  const seq = String(max + 1).padStart(4, "0");
  return `${stem}${seq}`;
}

import { prisma } from "../../src/lib/prisma";

const MAP = [
  ["นายธรรมรัตน์ สุวรรณคีรี", "นายณัฐพงษ์ ศรีสุวรรณ"],
  ["นายวรวิช ช่วง", "นายกิตติศักดิ์ วงศ์ทอง"],
  ["จ.ส.ต.เชษฐณรงค์ สาระรัมย์", "จ.ส.ต.ชัยวัฒน์ สาระวงศ์"],
];

async function main() {
  const cases = await prisma.smartPoliceCase.findMany({ where: { caseNumber: "1132/2554" } });
  for (const c of cases) {
    let chargeText = c.chargeText ?? "";
    let summary = c.summary ?? "";
    let behavior = c.behaviorText ?? "";
    for (const [from, to] of MAP) {
      chargeText = chargeText.split(from).join(to);
      summary = summary.split(from).join(to);
      behavior = behavior.split(from).join(to);
    }
    await prisma.smartPoliceCase.update({
      where: { id: c.id },
      data: { chargeText, summary, behaviorText: behavior },
    });
    for (const [from, to] of MAP) {
      await prisma.smartPoliceParty.updateMany({
        where: { caseId: c.id, fullName: from },
        data: { fullName: to },
      });
    }
    console.log("อัปเดตคดี", c.caseNumber);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

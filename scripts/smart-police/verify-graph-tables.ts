import { prisma } from "../../src/lib/prisma";

async function main() {
  const counts = {
    suspects: await prisma.smartPoliceSuspect.count(),
    addresses: await prisma.smartPoliceSuspectAddress.count(),
    logs: await prisma.smartPoliceInvestigationLog.count(),
    reports: await prisma.smartPoliceInvestigationReport.count(),
    links: await prisma.smartPoliceLink.count(),
    suspectCases: await prisma.smartPoliceSuspectCase.count(),
  };
  console.log("ตารางกราฟอ่านได้:", JSON.stringify(counts));

  // ตรวจว่าสร้าง-อ่าน-ลบได้จริง 1 คน (rollback ด้วยการลบ)
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) {
    console.log("ไม่มีผู้ใช้ — ทดสอบเฉพาะการอ่าน");
    return;
  }
  const s = await prisma.smartPoliceSuspect.create({
    data: {
      ownerUserId: owner.id,
      fullName: "ทดสอบ ระบบกราฟ",
      alias: "T-" + Date.now(),
      riskLevel: "LOW",
    },
  });
  const read = await prisma.smartPoliceSuspect.findUnique({ where: { id: s.id } });
  await prisma.smartPoliceSuspect.delete({ where: { id: s.id } });
  console.log("สร้าง/อ่าน/ลบ suspect:", read?.fullName === "ทดสอบ ระบบกราฟ" ? "ผ่าน" : "ไม่ผ่าน");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

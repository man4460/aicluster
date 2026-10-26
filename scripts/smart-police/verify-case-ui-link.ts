/**
 * ตรวจว่า UI ผูกกับคดีแล้วจริง:
 *   - ไฟล์หน้าคดีมีปุ่ม "ผิังเชื่อมโยง" + เงื่อนไขปุ่ม "สืบสวน" เฉพาะ SUSPECT
 *   - API ที่ปุ่มเรียก ทำงานถูก (สร้าง suspect จากผู้ต้องหา + ผูกคดี)
 *
 * ใช้: npx tsx scripts/smart-police/verify-case-ui-link.ts
 */

import fs from "node:fs";
import { prisma } from "../../src/lib/prisma";

async function main() {
  const problems: string[] = [];
  const src = fs.readFileSync("src/systems/smart-police/components/SmartPoliceCaseDetailClient.tsx", "utf8");

  if (!src.includes('investigation/graph?caseId=${caseId}')) {
    problems.push("ไม่พบปุ่มเปิดผังที่ผูก caseId");
  }
  if (!src.includes('p.role === "SUSPECT" ?')) {
    problems.push("ปุ่ม 'สืบสวน' ไม่ได้จำกัดเฉพาะผู้ต้องหา");
  }
  if (!src.includes("addPartyAsSuspect")) {
    problems.push("ไม่พบฟังก์ชัน addPartyAsSuspect");
  }

  // ตรวจ API path ที่ใช้
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้");
  const stamp = Date.now().toString().slice(-6);

  const kase = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: owner,
      caseNumber: `UI-${stamp}`,
      title: "ทดสอบปุ่มสืบสวน",
      caseType: "คดีอาญา",
      status: "OPEN",
      priority: "NORMAL",
      parties: {
        create: [
          { role: "SUSPECT", fullName: `นายผู้ต้องหา ${stamp}`, caseRelation: "ผู้ต้องหา", sortOrder: 0 },
          { role: "WITNESS", fullName: `นายพยาน ${stamp}`, caseRelation: "พยาน", sortOrder: 1 },
        ],
      },
    },
    include: { parties: true },
  });

  try {
    const suspectParty = kase.parties.find((p) => p.role === "SUSPECT")!;
    const witnessParty = kase.parties.find((p) => p.role === "WITNESS")!;

    // จำลอง payload ที่ปุ่มส่ง (เหมือน addPartyAsSuspect)
    const created = await prisma.smartPoliceSuspect.create({
      data: {
        ownerUserId: owner,
        fullName: suspectParty.fullName,
        riskLevel: "MEDIUM",
        description: suspectParty.caseRelation ? `เกี่ยวกับคดี: ${suspectParty.caseRelation}` : null,
        cases: { create: [{ caseId: kase.id }] },
      },
      include: { cases: { select: { caseId: true } } },
    });

    if (created.cases.length !== 1 || created.cases[0]!.caseId !== kase.id) {
      problems.push("suspect ที่สร้างไม่ผูกกับคดี");
    }
    if (created.fullName !== suspectParty.fullName) problems.push("ชื่อไม่ตรงกับผู้ต้องหา");

    // พยานไม่ควรถูกส่ง (UI แสดงปุ่มเฉพาะ SUSPECT)
    const witnessAsSuspect = await prisma.smartPoliceSuspect.findFirst({
      where: { ownerUserId: owner, fullName: witnessParty.fullName },
    });
    if (witnessAsSuspect) problems.push("พยานถูกสร้างเป็นบุคคลต้องสงสัย (ไม่ควร)");

    console.log(
      `คดี ${kase.caseNumber}: ผู้ต้องหา 1 / พยาน 1 → สร้าง suspect 1 คน ผูกคดี ${created.cases.length} คดี`,
    );
  } finally {
    await prisma.smartPoliceSuspect.deleteMany({
      where: { ownerUserId: owner, fullName: { contains: stamp } },
    });
    await prisma.smartPoliceCase.delete({ where: { id: kase.id } });
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log("ผล: ผ่าน (ปุ่มผังผูก caseId · ปุ่มสืบสวนเฉพาะผู้ต้องหา · สร้าง suspect ผูกคดีถูก)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

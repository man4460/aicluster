/**
 * ตรวจการผูกงานสืบสวนกับคดีเดิม:
 *   1) ผู้ต้องหาในคดี → สร้างเป็นบุคคลต้องสงสัย (ผูก caseId)
 *   2) กราฟกรองด้วย caseId เห็นเฉพาะคนของคดีนั้น
 *   3) เพิ่มเส้นเชื่อมระหว่าง 2 คนในคดี แล้วกราฟของคดีมี degree เพิ่ม
 *
 * ใช้: npx tsx scripts/smart-police/verify-case-investigation-link.ts
 */

import { prisma } from "../../src/lib/prisma";

async function main() {
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้");
  const problems: string[] = [];
  const stamp = Date.now().toString().slice(-6);

  const kase = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: owner,
      caseNumber: `LINK-${stamp}`,
      title: "คดีทดสอบผูกสืบสวน",
      caseType: "คดีอาญา",
      status: "OPEN",
      priority: "NORMAL",
      parties: {
        create: [
          { role: "SUSPECT", fullName: `นายทดสอบ หนึ่ง ${stamp}`, caseRelation: "ผู้ต้องหาที่ 1", sortOrder: 0 },
          { role: "SUSPECT", fullName: `นายทดสอบ สอง ${stamp}`, caseRelation: "ผู้ต้องหาที่ 2", sortOrder: 1 },
          { role: "COMPLAINANT", fullName: "ผู้กล่าวหาทดสอบ", caseRelation: "ผู้เสียหาย", sortOrder: 2 },
        ],
      },
    },
    include: { parties: true },
  });

  try {
    // --- 1) สร้าง suspect จากผู้ต้องหา 2 คน (จำลองการกดปุ่มในหน้าคดี) ---
    const suspects = kase.parties.filter((p) => p.role === "SUSPECT");
    const ids: string[] = [];
    for (const p of suspects) {
      const s = await prisma.smartPoliceSuspect.create({
        data: {
          ownerUserId: owner,
          fullName: p.fullName,
          riskLevel: "MEDIUM",
          status: "ACTIVE",
          description: p.caseRelation ? `เกี่ยวกับคดี: ${p.caseRelation}` : null,
          cases: { create: [{ caseId: kase.id }] },
        },
      });
      ids.push(s.id);
    }
    if (ids.length !== 2) problems.push(`สร้าง suspect ได้ ${ids.length} (คาด 2)`);

    // --- 2) กราฟกรองตามคดี ---
    const filtered = await prisma.smartPoliceSuspect.findMany({
      where: { ownerUserId: owner, cases: { some: { caseId: kase.id } } },
    });
    if (filtered.length !== 2) problems.push(`กราฟกรองคดีได้ ${filtered.length} คน (คาด 2)`);
    if (filtered.some((s) => s.fullName === "ผู้กล่าวหาทดสอบ")) {
      problems.push("ผู้กล่าวหาถูกนับเป็นบุคคลต้องสงสัย (ไม่ควร)");
    }

    // --- 3) เพิ่มเส้นเชื่อม + ดูดีกรี ---
    await prisma.smartPoliceLink.create({
      data: { ownerUserId: owner, fromId: ids[0]!, toId: ids[1]!, kind: "CO_SUSPECT", weight: 3, strength: 4 },
    });
    const links = await prisma.smartPoliceLink.findMany({
      where: { ownerUserId: owner, fromId: { in: ids } },
    });
    if (links.length !== 1) problems.push("เส้นเชื่อมไม่ถูกบันทึก");

    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.fromId, (degree.get(l.fromId) ?? 0) + 1);
      degree.set(l.toId, (degree.get(l.toId) ?? 0) + 1);
    }
    if ((degree.get(ids[0]!) ?? 0) !== 1) problems.push("degree ของคนที่ 1 ไม่เพิ่ม");

    console.log(`คดี ${kase.caseNumber} · ผู้ต้องหาในคดี 2 คน → suspect 2 คน · กรองคดีได้ ${filtered.length} คน · เส้นเชื่อม ${links.length}`);
    console.log(`ดีกรี: ${ids.map((id) => `${filtered.find((f) => f.id === id)?.fullName}=${degree.get(id) ?? 0}`).join(", ")}`);
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
  console.log("ผล: ผ่าน (ผู้ต้องหา→บุคคลต้องสงสัย→กรองตามคดี→เส้นเชื่อม ครบวงจร)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

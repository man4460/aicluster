/**
 * เติมข้อมูลกราฟตัวอย่างให้บัญชีทดสอบ (ใช้เฉพาะ QA หน้า /investigation/graph)
 * ใช้: npx tsx scripts/smart-police/seed-graph-demo.ts
 * ลบได้ด้วย: npx tsx scripts/smart-police/seed-graph-demo.ts --clean
 */

import { prisma } from "../../src/lib/prisma";

const EMAIL = process.env.TEST_EMAIL || "graph-test@local.test";
const TAG = "GRAPH-DEMO";

async function main() {
  const user = await prisma.user.findFirst({ where: { email: EMAIL }, select: { id: true } });
  if (!user) throw new Error("ไม่พบบัญชีทดสอบ");
  const ownerUserId = user.id;

  if (process.argv.includes("--clean")) {
    const cases = await prisma.smartPoliceCase.findMany({
      where: { ownerUserId, caseNumber: { startsWith: TAG } },
      select: { id: true },
    });
    const caseIds = cases.map((c) => c.id);
    await prisma.smartPoliceSuspect.deleteMany({ where: { ownerUserId, fullName: { contains: "เดโม" } } });
    await prisma.smartPoliceInvestigationLog.deleteMany({ where: { ownerUserId, caseId: { in: caseIds } } });
    await prisma.smartPoliceInvestigationReport.deleteMany({ where: { ownerUserId, caseId: { in: caseIds } } });
    await prisma.smartPoliceCase.deleteMany({ where: { id: { in: caseIds } } });
    console.log("ลบข้อมูลเดโมแล้ว");
    return;
  }

  const existing = await prisma.smartPoliceSuspect.count({
    where: { ownerUserId, fullName: { contains: "เดโม" } },
  });
  if (existing > 0) {
    console.log("มีข้อมูลเดโมอยู่แล้ว (" + existing + " คน)");
    return;
  }

  const caseA = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId,
      caseNumber: `${TAG}-1/2567`,
      title: "คดีเดโม ยาเสพติด เครือข่าย A",
      caseType: "คดียาเสพติด",
      status: "OPEN",
      priority: "HIGH",
    },
  });
  const caseB = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId,
      caseNumber: `${TAG}-2/2567`,
      title: "คดีเดโม ลักทรัพย์ เครือข่าย B",
      caseType: "คดีทรัพย์",
      status: "OPEN",
      priority: "NORMAL",
    },
  });

  const people = [
    { name: "นายเดโม หนึ่ง", risk: "HIGH", caseIds: [caseA.id, caseB.id] },
    { name: "นายเดโม สอง", risk: "HIGH", caseIds: [caseA.id] },
    { name: "นายเดโม สาม", risk: "MEDIUM", caseIds: [caseA.id] },
    { name: "นายเดโม สี่", risk: "MEDIUM", caseIds: [caseB.id] },
    { name: "นายเดโม ห้า", risk: "LOW", caseIds: [caseB.id] },
    { name: "นายเดโม หก", risk: "MEDIUM", caseIds: [caseA.id, caseB.id] },
  ];

  const ids: string[] = [];
  for (const p of people) {
    const s = await prisma.smartPoliceSuspect.create({
      data: {
        ownerUserId,
        fullName: p.name,
        alias: p.name.split(" ").pop() ?? null,
        riskLevel: p.risk,
        status: "ACTIVE",
        cases: { create: p.caseIds.map((caseId) => ({ caseId })) },
      },
    });
    ids.push(s.id);
  }

  await prisma.smartPoliceSuspectAddress.create({
    data: {
      suspectId: ids[0]!,
      kind: "HOME",
      label: "บ้านเดโม",
      address: "99 หมู่ 1 ต.เดโม อ.เดโม",
      latitude: 7.0089,
      longitude: 100.4767,
      source: "ลงพื้นที่",
    },
  });
  await prisma.smartPoliceSuspectAddress.create({
    data: {
      suspectId: ids[3]!,
      kind: "WORK",
      label: "ที่ทำงานเดโม",
      address: "ตลาดเดโม",
      latitude: 7.0121,
      longitude: 100.4701,
      source: "สอบถาม",
    },
  });

  const pairs: Array<[number, number, "FAMILY" | "KNOWN" | "GANG" | "MONEY" | "PHONE"]> = [
    [0, 1, "FAMILY"],
    [0, 2, "KNOWN"],
    [0, 5, "MONEY"],
    [1, 2, "GANG"],
    [1, 3, "PHONE"],
    [3, 4, "KNOWN"],
    [4, 5, "GANG"],
    [2, 5, "PHONE"],
  ];
  for (const [a, b, kind] of pairs) {
    await prisma.smartPoliceLink.create({
      data: { ownerUserId, fromId: ids[a]!, toId: ids[b]!, kind, weight: 2, strength: 3 },
    });
  }

  await prisma.smartPoliceInvestigationLog.create({
    data: {
      ownerUserId,
      suspectId: ids[0]!,
      caseId: caseA.id,
      occurredAt: new Date(),
      place: "บ้านเดโม",
      latitude: 7.0089,
      longitude: 100.4767,
      officerName: "ด.ต.เดโม",
      activity: "SURVEILLANCE",
      result: "พบผู้ต้องสงสัยกลับบ้าน 21:30",
    },
  });
  await prisma.smartPoliceInvestigationReport.create({
    data: {
      ownerUserId,
      caseId: caseA.id,
      title: "รายงานสืบเดโม",
      reportNo: "สืบ 1/2567",
      officerName: "ด.ต.เดโม",
      summary: "สรุปเครือข่าย A",
      body: "รายละเอียด",
      finding: "เชื่อมโยงกับเครือข่าย B ผ่านบุคคลที่ 6",
    },
  });

  console.log(`สร้างข้อมูลเดโม: 6 คน · 8 เส้น · 2 คดี · 2 พิกัด · log+report`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

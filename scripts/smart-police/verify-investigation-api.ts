/**
 * ตรวจ API ชุดสืบสวนแบบ headless: สร้าง suspects → links → address → log → report → อ่าน /graph
 * ใช้: npx tsx scripts/smart-police/verify-investigation-api.ts [--keep]
 *
 * ค่าเริ่มต้นจะลบข้อมูลทดสอบทิ้งเมื่อจบ
 */

import { prisma } from "../../src/lib/prisma";
import { LINK_KIND_LABELS } from "../../src/lib/smart-police/investigation/types";

type GraphNode = { id: string; type: string; label: string; degree: number };
type GraphEdge = { id: string; source: string; target: string; kind: string; label: string };

async function main() {
  const keep = process.argv.includes("--keep");
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้ในฐานข้อมูล");

  const stamp = Date.now().toString().slice(-6);
  const problems: string[] = [];
  const createdSuspectIds: string[] = [];
  const createdCaseIds: string[] = [];
  let createdLinkIds: string[] = [];

  try {
    // ---- 3 คดี ----
    for (const n of [1, 2, 3]) {
      const c = await prisma.smartPoliceCase.create({
        data: {
          ownerUserId: owner,
          caseNumber: `GR-${stamp}-${n}`,
          title: `คดีทดสอบกราฟ ${n}`,
          caseType: "คดีอาญา",
          status: "OPEN",
          priority: "NORMAL",
        },
      });
      createdCaseIds.push(c.id);
    }

    // ---- 6 บุคคลต้องสงสัย ----
    const names = ["นายเอ ทดสอบ", "นายบี ทดสอบ", "นายซี ทดสอบ", "นายดี ทดสอบ", "นายอี ทดสอบ", "นายเอฟ ทดสอบ"];
    for (let i = 0; i < names.length; i++) {
      const s = await prisma.smartPoliceSuspect.create({
        data: {
          ownerUserId: owner,
          fullName: names[i]!,
          alias: `A${i + 1}-${stamp}`,
          riskLevel: i === 0 ? "HIGH" : "MEDIUM",
          status: "ACTIVE",
          cases: { create: [{ caseId: createdCaseIds[i % 3]! }, { caseId: createdCaseIds[(i + 1) % 3]! }] },
        },
      });
      createdSuspectIds.push(s.id);
    }

    // ---- 8 เส้นเชื่อม ----
    const pairs: Array<[number, number, keyof typeof LINK_KIND_LABELS]> = [
      [0, 1, "FAMILY"],
      [0, 2, "KNOWN"],
      [0, 3, "PHONE"],
      [1, 4, "MONEY"],
      [2, 3, "GANG"],
      [3, 4, "KNOWN"],
      [4, 5, "CO_SUSPECT"],
      [2, 5, "PHONE"],
    ];
    for (const [a, b, kind] of pairs) {
      const link = await prisma.smartPoliceLink.create({
        data: {
          ownerUserId: owner,
          fromId: createdSuspectIds[a]!,
          toId: createdSuspectIds[b]!,
          kind,
          weight: 2,
          strength: 3,
          label: LINK_KIND_LABELS[kind],
        },
      });
      createdLinkIds.push(link.id);
    }

    // ---- พิกัด + ประวัติ + รายงาน ----
    await prisma.smartPoliceSuspectAddress.create({
      data: {
        suspectId: createdSuspectIds[0]!,
        kind: "HOME",
        address: "123 ถนนทดสอบ ต.ทดสอบ",
        latitude: 7.0089,
        longitude: 100.4767,
        source: "ลงพื้นที่",
      },
    });
    await prisma.smartPoliceInvestigationLog.create({
      data: {
        ownerUserId: owner,
        suspectId: createdSuspectIds[0]!,
        caseId: createdCaseIds[0]!,
        occurredAt: new Date(),
        place: "หน้าบ้านผู้ต้องสงสัย",
        latitude: 7.0089,
        longitude: 100.4767,
        officerName: "ด.ต.ทดสอบ",
        activity: "SURVEILLANCE",
        result: "พบผู้ต้องสงสัยกลับบ้านเวลา 21:30",
      },
    });
    await prisma.smartPoliceInvestigationReport.create({
      data: {
        ownerUserId: owner,
        caseId: createdCaseIds[0]!,
        title: `รายงานสืบสวนทดสอบ ${stamp}`,
        reportNo: `สืบ ${stamp}`,
        officerName: "ด.ต.ทดสอบ",
        summary: "สรุปผลการสืบ",
        body: "รายละเอียดการสืบ",
        finding: "พบความเชื่อมโยงกับบุคคลที่ 2",
      },
    });

    // ---- อ่านกลับผ่าน logic เดียวกับ /graph ----
    const suspects = await prisma.smartPoliceSuspect.findMany({
      where: { ownerUserId: owner, id: { in: createdSuspectIds } },
      include: { addresses: true, cases: { select: { caseId: true } } },
    });
    const links = await prisma.smartPoliceLink.findMany({
      where: { ownerUserId: owner, fromId: { in: createdSuspectIds } },
    });
    const reports = await prisma.smartPoliceInvestigationReport.findMany({
      where: { ownerUserId: owner, caseId: { in: createdCaseIds } },
    });
    const logs = await prisma.smartPoliceInvestigationLog.findMany({
      where: { ownerUserId: owner, suspectId: { in: createdSuspectIds } },
    });

    const degreeMap = new Map<string, number>();
    const bump = (id: string) => degreeMap.set(id, (degreeMap.get(id) ?? 0) + 1);
    for (const l of links) {
      bump(`suspect:${l.fromId}`);
      bump(`suspect:${l.toId}`);
    }
    for (const s of suspects) {
      for (const c of s.cases) {
        bump(`suspect:${s.id}`);
        bump(`case:${c.caseId}`);
      }
    }

    const nodes: GraphNode[] = [
      ...suspects.map((s) => ({
        id: `suspect:${s.id}`,
        type: "SUSPECT",
        label: s.fullName,
        degree: degreeMap.get(`suspect:${s.id}`) ?? 0,
      })),
    ];
    const edges: GraphEdge[] = links.map((l) => ({
      id: l.id,
      source: `suspect:${l.fromId}`,
      target: `suspect:${l.toId}`,
      kind: l.kind,
      label: l.label ?? LINK_KIND_LABELS[l.kind as keyof typeof LINK_KIND_LABELS],
    }));

    console.log(`บุคคลต้องสงสัย ${suspects.length} · เส้นเชื่อม ${links.length} · ดีกรีรวม ${[...degreeMap.values()].reduce((a, b) => a + b, 0)}`);
    console.log(`ประวัติการสืบ ${logs.length} · รายงาน ${reports.length} · พิกัด ${suspects.reduce((n, s) => n + s.addresses.length, 0)}`);
    console.log("top hub:", nodes.sort((a, b) => b.degree - a.degree)[0]);

    if (suspects.length !== 6) problems.push(`suspects = ${suspects.length} (คาด 6)`);
    if (links.length !== 8) problems.push(`links = ${links.length} (คาด 8)`);
    if (edges.length !== links.length) problems.push("edges ไม่ครบ");
    if (nodes[0] && nodes[0].degree < 4) problems.push("degree ของ hub ต่ำเกินคาด");
    if (logs.length !== 1) problems.push("ประวัติการสืบไม่ถูกบันทึก");
    if (reports.length !== 1) problems.push("รายงานไม่ถูกบันทึก");
    if (suspects.reduce((n, s) => n + s.addresses.length, 0) !== 1) problems.push("พิกัดไม่ถูกบันทึก");
  } finally {
    if (!keep) {
      await prisma.smartPoliceLink.deleteMany({ where: { id: { in: createdLinkIds } } });
      await prisma.smartPoliceSuspect.deleteMany({ where: { id: { in: createdSuspectIds } } });
      await prisma.smartPoliceInvestigationReport.deleteMany({ where: { caseId: { in: createdCaseIds } } });
      await prisma.smartPoliceInvestigationLog.deleteMany({ where: { caseId: { in: createdCaseIds } } });
      await prisma.smartPoliceCase.deleteMany({ where: { id: { in: createdCaseIds } } });
    } else {
      console.log("เก็บข้อมูลทดสอบไว้ (--keep) · caseIds:", createdCaseIds.join(","));
    }
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log("ผล: ผ่าน (สร้าง/อ่าน suspect · link · address · log · report ครบ)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

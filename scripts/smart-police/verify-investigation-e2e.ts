/**
 * ตรวจรวมงานสืบสวนแบบไม่ต้องพึ่ง UI:
 *   - ข้อมูลตัวอย่าง 6 คน / 3 คดี / 8 เส้น
 *   - เรียก /graph (logic เดียวกัน) แล้วรัน analyzeNetwork
 *   - ตรวจว่าผลวิเคราะห์คืน "กลุ่ม" และ "ตัวเชื่อมกลาง" ถูกต้อง
 *
 * ใช้: npx tsx scripts/smart-police/verify-investigation-e2e.ts
 */

import { prisma } from "../../src/lib/prisma";
import { analyzeNetwork } from "../../src/lib/smart-police/investigation/analyze";
import type { GraphEdgeDto, GraphNodeDto } from "../../src/lib/smart-police/investigation/types";
import { LINK_KIND_LABELS } from "@/lib/smart-police/investigation/types";

const SUSPECTS = ["นายตรวจ หนึ่ง", "นายตรวจ สอง", "นายตรวจ สาม", "นายตรวจ สี่", "นายตรวจ ห้า", "นายตรวจ หก"];
const LINK_PAIRS: Array<[number, number, "FAMILY" | "KNOWN" | "GANG" | "MONEY" | "PHONE" | "CO_SUSPECT"]> = [
  [0, 1, "FAMILY"],
  [0, 2, "KNOWN"],
  [0, 3, "PHONE"],
  [1, 4, "MONEY"],
  [2, 3, "GANG"],
  [3, 4, "KNOWN"],
  [4, 5, "CO_SUSPECT"],
  [2, 5, "PHONE"],
];

async function main() {
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้");
  const stamp = Date.now().toString().slice(-6);
  const problems: string[] = [];
  const caseIds: string[] = [];
  const suspectIds: string[] = [];

  try {
    for (let i = 0; i < 3; i++) {
      const c = await prisma.smartPoliceCase.create({
        data: {
          ownerUserId: owner,
          caseNumber: `E2E-INV-${stamp}-${i + 1}`,
          title: `คดีตรวจกราฟ ${i + 1}`,
          caseType: "คดีอาญา",
          status: "OPEN",
          priority: "NORMAL",
        },
      });
      caseIds.push(c.id);
    }

    for (let i = 0; i < SUSPECTS.length; i++) {
      const s = await prisma.smartPoliceSuspect.create({
        data: {
          ownerUserId: owner,
          fullName: `${SUSPECTS[i]} ${stamp}`,
          riskLevel: i === 0 ? "HIGH" : "MEDIUM",
          status: "ACTIVE",
          cases: { create: [{ caseId: caseIds[i % 3]! }, { caseId: caseIds[(i + 1) % 3]! }] },
        },
      });
      suspectIds.push(s.id);
    }

    for (const [a, b, kind] of LINK_PAIRS) {
      await prisma.smartPoliceLink.create({
        data: {
          ownerUserId: owner,
          fromId: suspectIds[a]!,
          toId: suspectIds[b]!,
          kind,
          weight: 2,
          strength: 3,
          label: LINK_KIND_LABELS[kind],
        },
      });
    }

    // ---- สร้าง nodes/edges แบบเดียวกับ route /graph ----
    const suspects = await prisma.smartPoliceSuspect.findMany({
      where: { ownerUserId: owner, id: { in: suspectIds } },
      include: { cases: { select: { caseId: true } } },
    });
    const links = await prisma.smartPoliceLink.findMany({
      where: { ownerUserId: owner, fromId: { in: suspectIds } },
    });
    const cases = await prisma.smartPoliceCase.findMany({
      where: { ownerUserId: owner, id: { in: caseIds } },
      select: { id: true, caseNumber: true },
    });

    const degree = new Map<string, number>();
    const bump = (id: string) => degree.set(id, (degree.get(id) ?? 0) + 1);
    const nodes: GraphNodeDto[] = [
      ...suspects.map((s) => ({
        id: `suspect:${s.id}`,
        type: "SUSPECT" as const,
        label: s.fullName,
        sublabel: null,
        degree: 0,
        riskLevel: s.riskLevel as "HIGH" | "MEDIUM" | "LOW",
      })),
      ...cases.map((c) => ({
        id: `case:${c.id}`,
        type: "CASE" as const,
        label: c.caseNumber,
        sublabel: null,
        degree: 0,
        caseNumber: c.caseNumber,
      })),
    ];
    const edges: GraphEdgeDto[] = [];
    for (const l of links) {
      edges.push({
        id: l.id,
        source: `suspect:${l.fromId}`,
        target: `suspect:${l.toId}`,
        kind: l.kind as GraphEdgeDto["kind"],
        label: l.label ?? l.kind,
        weight: l.weight,
        directed: false,
        caseId: l.caseId,
      });
      bump(`suspect:${l.fromId}`);
      bump(`suspect:${l.toId}`);
    }
    for (const s of suspects) {
      for (const c of s.cases) {
        edges.push({
          id: `sc:${s.id}:${c.caseId}`,
          source: `suspect:${s.id}`,
          target: `case:${c.caseId}`,
          kind: "CO_SUSPECT",
          label: "ผู้ต้องสงสัยในคดี",
          weight: 1,
          directed: false,
          caseId: c.caseId,
        });
        bump(`suspect:${s.id}`);
        bump(`case:${c.caseId}`);
      }
    }
    for (const n of nodes) n.degree = degree.get(n.id) ?? 0;

    const analysis = analyzeNetwork({ nodes, edges });

    // ---- ตรวจผล ----
    if (nodes.length !== 6 + 3) problems.push(`nodes ${nodes.length} (คาด 9 = 6 คน + 3 คดี)`);
    if (links.length !== 8) problems.push(`links ${links.length} (คาด 8)`);

    const hub = analysis.betweenness[0]!;
    // ตรวจหลักการ: ตัวเชื่อมกลางต้องเป็นโหนดที่ degree สูงสุด (เสมอหรือสูงกว่าเพื่อน)
    const maxDegree = Math.max(...nodes.filter((n) => n.type === "SUSPECT").map((n) => n.degree));
    const hubNode = nodes.find((n) => n.id === hub.nodeId);
    if (!hubNode) problems.push("betweenness อ้างถึงโหนดที่ไม่มีอยู่");
    if (hubNode && hubNode.degree < maxDegree - 1) {
      problems.push(`ตัวเชื่อมกลาง (${hub.label}, degree ${hubNode.degree}) ต่ำกว่าโหนดดีกรีสูงสุด (${maxDegree})`);
    }
    if (analysis.betweenness[0]!.score <= 0) problems.push("betweenness ของตัวเชื่อมกลาง = 0");

    if (analysis.components.length !== 1) {
      problems.push(`เครือข่ายควรเชื่อมกันหมด แต่ได้ ${analysis.components.length} กลุ่ม`);
    }
    if (analysis.communities.length < 2) {
      problems.push(`ควรแยกได้ ≥2 community แต่ได้ ${analysis.communities.length}`);
    }
    if (!analysis.riskPoints.some((r) => r.level === "HIGH")) {
      problems.push("ไม่พบจุดเสี่ยงระดับ HIGH");
    }

    console.log(`nodes ${nodes.length} · edges ${edges.length} · links ${links.length}`);
    console.log(
      `components ${analysis.components.length} · communities ${analysis.communities.length} (${analysis.communities
        .map((c) => c.size)
        .join("+")})`,
    );
    console.log(`ตัวเชื่อมกลาง: ${analysis.betweenness[0]!.label} (${analysis.betweenness[0]!.score})`);
    console.log(`จุดเสี่ยง HIGH: ${analysis.riskPoints.filter((r) => r.level === "HIGH").length} คน`);
    console.log(`density ${analysis.summary.density} · avgPath ${analysis.summary.avgPathLength}`);
  } finally {
    await prisma.smartPoliceLink.deleteMany({
      where: { ownerUserId: owner, fromId: { in: suspectIds } },
    });
    await prisma.smartPoliceSuspect.deleteMany({ where: { id: { in: suspectIds } } });
    await prisma.smartPoliceCase.deleteMany({ where: { id: { in: caseIds } } });
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log("ผล: ผ่าน (6 คน / 3 คดี / 8 เส้น · วิเคราะห์คืนกลุ่มและตัวเชื่อมกลางถูกต้อง)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

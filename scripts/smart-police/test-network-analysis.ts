/**
 * Unit test ฟังก์ชันวิเคราะห์เครือข่าย ด้วยข้อมูลจำลอง
 * ใช้: npx tsx scripts/smart-police/test-network-analysis.ts
 */

import {
  analyzeNetwork,
  averagePathLength,
  betweennessCentrality,
  connectedComponents,
  detectCommunities,
  findCoOccurrences,
  findRiskPoints,
  graphDensity,
} from "../../src/lib/smart-police/investigation/analyze";
import type { GraphEdgeDto, GraphNodeDto } from "../../src/lib/smart-police/investigation/types";

const fails: string[] = [];
function check(name: string, cond: boolean, detail?: unknown) {
  if (!cond) fails.push(name + (detail === undefined ? "" : " → " + JSON.stringify(detail)));
  console.log((cond ? "  ok  " : "  FAIL") + " " + name);
}

function suspect(id: string, label: string, risk: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM"): GraphNodeDto {
  return { id: `suspect:${id}`, type: "SUSPECT", label, sublabel: null, degree: 0, riskLevel: risk };
}
function caseNode(id: string, caseNumber: string): GraphNodeDto {
  return { id: `case:${id}`, type: "CASE", label: caseNumber, sublabel: null, degree: 0, caseNumber };
}
function link(a: string, b: string, kind: GraphEdgeDto["kind"], id: string): GraphEdgeDto {
  return { id, source: `suspect:${a}`, target: `suspect:${b}`, kind, label: kind, weight: 1, directed: false, caseId: null };
}
function caseEdge(s: string, c: string, caseId: string): GraphEdgeDto {
  return {
    id: `sc:${s}:${c}`,
    source: `suspect:${s}`,
    target: `case:${c}`,
    kind: "CO_SUSPECT",
    label: "ผู้ต้องสงสัยในคดี",
    weight: 1,
    directed: false,
    caseId,
  };
}

// ------------------------------------------------------------------ ชุดที่ 1: วงกลม 4 คน + แขน 2 (ตัวเชื่อมกลางชัดเจน)
console.log("\n[1] ตัวเชื่อมกลาง (betweenness) — ดาว 5 แฉก");
{
  const nodes = [suspect("hub", "ศูนย์กลาง"), suspect("a", "A"), suspect("b", "B"), suspect("c", "C"), suspect("d", "D")];
  const edges = [
    link("hub", "a", "KNOWN", "e1"),
    link("hub", "b", "KNOWN", "e2"),
    link("hub", "c", "KNOWN", "e3"),
    link("hub", "d", "KNOWN", "e4"),
  ];
  const bet = betweennessCentrality({ nodes, edges });
  check("hub มี betweenness สูงสุด", bet[0]!.nodeId === "suspect:hub" && bet[0]!.score > 0, bet[0]);
  check("ใบทั้ง 4 มี betweenness = 0", bet.slice(1).every((b) => b.score === 0), bet.slice(1));
}

// ------------------------------------------------------------------ ชุดที่ 2: 2 เครือข่ายแยกกัน
console.log("\n[2] กลุ่มที่เชื่อมถึงกัน (connected components)");
{
  const nodes = [suspect("a", "A"), suspect("b", "B"), suspect("c", "C"), suspect("d", "D"), suspect("e", "E")];
  const edges = [link("a", "b", "FAMILY", "e1"), link("c", "d", "GANG", "e2")];
  const comps = connectedComponents({ nodes, edges });
  check("ได้ 3 กลุ่ม (2+2+1)", comps.length === 3, comps.map((c) => c.size));
  check("กลุ่มใหญ่สุดมี 2 โหนด", comps[0]!.size === 2, comps[0]!.size);
  check("โหนดเดี่ยว e อยู่กลุ่มสุดท้าย", comps[2]!.nodeIds.includes("suspect:e"), comps[2]);
}

// ------------------------------------------------------------------ ชุดที่ 3: community 2 กลุ่มที่เชื่อมกันด้วยเส้นเดียว
console.log("\n[3] community (Louvain modularity)");
{
  const nodes = ["a", "b", "c", "p", "q", "r"].map((id) => suspect(id, id.toUpperCase()));
  const edges = [
    link("a", "b", "KNOWN", "1"),
    link("b", "c", "KNOWN", "2"),
    link("a", "c", "KNOWN", "3"),
    link("p", "q", "KNOWN", "4"),
    link("q", "r", "KNOWN", "5"),
    link("p", "r", "KNOWN", "6"),
    link("c", "p", "KNOWN", "7"),
  ];
  const comms = detectCommunities({ nodes, edges });
  check("ได้ 2 community", comms.length === 2, comms.map((c) => c.size));
  const sizes = comms.map((c) => c.size).sort();
  check("ขนาด 3+3", sizes[0] === 3 && sizes[1] === 3, sizes);
  check("มีสีกำกับทุก community", comms.every((c) => /^#/.test(c.color)), comms.map((c) => c.color));
}

// ------------------------------------------------------------------ ชุดที่ 4: คู่ที่ร่วมคดีหลายคดี
console.log("\n[4] คู่ที่ไปปรากฏร่วมกันหลายคดี");
{
  const nodes = [suspect("a", "A"), suspect("b", "B"), suspect("c", "C"), caseNode("k1", "1/2567"), caseNode("k2", "2/2567")];
  const edges = [
    caseEdge("a", "k1", "k1"),
    caseEdge("b", "k1", "k1"),
    caseEdge("a", "k2", "k2"),
    caseEdge("b", "k2", "k2"),
    caseEdge("c", "k1", "k1"),
  ];
  const co = findCoOccurrences({ nodes, edges });
  check("พบคู่ A-B ที่ร่วม 2 คดี", co.length === 1 && co[0]!.count === 2, co);
  check("คู่ C ไม่ถูกนับ (คดีเดียว)", !co.some((x) => x.pairs.some((p) => p.a === "suspect:c")), co);
}

// ------------------------------------------------------------------ ชุดที่ 5: จุดเสี่ยง
console.log("\n[5] จุดเสี่ยง (ดีกรี/ตัวเชื่อมกลาง)");
{
  const nodes = [suspect("hub", "ศูนย์กลาง", "HIGH"), suspect("a", "A"), suspect("b", "B"), suspect("c", "C")];
  const edges = [link("hub", "a", "KNOWN", "1"), link("hub", "b", "KNOWN", "2"), link("hub", "c", "KNOWN", "3")];
  const risk = findRiskPoints({ nodes, edges });
  check(
    "hub เป็นจุดเสี่ยงระดับ HIGH (ดีกรีสูงสุด + ตัวเชื่อมกลาง)",
    risk[0]!.nodeId === "suspect:hub" && risk[0]!.level === "HIGH",
    risk[0],
  );
  check("มีเหตุผลประกอบ", (risk[0]!.reasons.length ?? 0) >= 2, risk[0]!.reasons);
}

// ------------------------------------------------------------------ ชุดที่ 6: ตัวชี้วัดรวม
console.log("\n[6] ตัวชี้วัดรวม (density / avg path)");
{
  const nodes = [suspect("a", "A"), suspect("b", "B"), suspect("c", "C")];
  const edges = [link("a", "b", "KNOWN", "1"), link("b", "c", "KNOWN", "2")];
  const density = graphDensity({ nodes, edges });
  check("density = 2*2/(3*2) = 0.6667", Math.abs(density - 0.6667) < 0.001, density);
  const avg = averagePathLength({ nodes, edges });
  check("avg path = (1+2+1)/3 ≈ 1.33", avg !== null && Math.abs(avg - 1.33) < 0.01, avg);
  const full = analyzeNetwork({ nodes, edges });
  check("analyzeNetwork คืนครบทุกส่วน", Boolean(full.components && full.communities && full.betweenness && full.riskPoints && full.summary), Object.keys(full));
}

// ------------------------------------------------------------------ ชุดที่ 7: กรณีว่าง
console.log("\n[7] กรณีไม่มีข้อมูล");
{
  const empty = analyzeNetwork({ nodes: [], edges: [] });
  check("ไม่พังเมื่อว่าง", empty.components.length === 0 && empty.summary.density === 0, empty.summary);
  check("avgPathLength = null", empty.summary.avgPathLength === null, empty.summary.avgPathLength);
}

console.log("");
if (fails.length) {
  console.error(`ไม่ผ่าน ${fails.length} ข้อ:\n  - ` + fails.join("\n  - "));
  process.exit(1);
}
console.log("ผล: ผ่านทุกข้อ");

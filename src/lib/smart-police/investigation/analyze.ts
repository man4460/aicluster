/**
 * วิเคราะห์เครือข่าย (network analysis) สำหรับผังเชื่อมโยงแบบ i2
 *
 * ทำงานบนข้อมูลจาก GET /api/smart-police/investigation/graph
 * ฟังก์ชันบริสุทธิ์ (pure) — ไม่แตะ DB จึงทดสอบได้ด้วยข้อมูลจำลอง
 *
 * หลักการ:
 *  - connectedComponents  : กลุ่มที่เชื่อมถึงกัน (แยกเป็นเครือข่าย)
 *  - labelPropagation     : community ภายในเครือข่าย (ใครอยู่กลุ่มย่อยไหน)
 *  - betweennessCentrality: ตัวเชื่อมกลาง (คนที่ถูกตัดแล้วเครือข่ายขาดจากกัน)
 *  - findCoOccurrences    : คู่ที่ไปปรากฏร่วมกันในหลายคดี
 *  - findRiskPoints       : จุดเสี่ยง — ดีกรีสูง / เกาะหลายเครือข่าย / ตัวเชื่อมกลาง
 */

import type { GraphEdgeDto, GraphNodeDto } from "@/lib/smart-police/investigation/types";

export type AnalysisInput = {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
};

export type ComponentInfo = {
  /** id ของ component (0,1,2,…) */
  index: number;
  nodeIds: string[];
  /** ขนาด = จำนวนโหนด */
  size: number;
  /** โหนดที่เชื่อมกับภายนอกมากที่สุดในกลุ่ม */
  hubId: string | null;
};

export type CommunityInfo = {
  index: number;
  nodeIds: string[];
  size: number;
  /** สีที่แนะนำสำหรับวาดผัง */
  color: string;
};

export type BetweennessEntry = {
  nodeId: string;
  label: string;
  score: number;
};

export type CoOccurrenceEntry = {
  caseIds: string[];
  count: number;
  /** คู่บุคคลที่ร่วมคดีกัน (suspectId) */
  pairs: Array<{ a: string; aLabel: string; b: string; bLabel: string }>;
};

export type RiskPointEntry = {
  nodeId: string;
  label: string;
  type: GraphNodeDto["type"];
  degree: number;
  betweenness: number;
  components: number;
  reasons: string[];
  level: "HIGH" | "MEDIUM" | "LOW";
};

export type NetworkAnalysis = {
  components: ComponentInfo[];
  communities: CommunityInfo[];
  betweenness: BetweennessEntry[];
  coOccurrences: CoOccurrenceEntry[];
  riskPoints: RiskPointEntry[];
  summary: {
    nodeCount: number;
    edgeCount: number;
    componentCount: number;
    communityCount: number;
    density: number;
    /** ความยาวเส้นทางเฉลี่ย (เฉพาะคู่ที่เชื่อมถึงกัน) */
    avgPathLength: number | null;
  };
};

const COMMUNITY_COLORS = [
  "#4f46e5",
  "#0891b2",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#0d9488",
];

type Adjacency = Map<string, Set<string>>;

function buildAdjacency(input: AnalysisInput): Adjacency {
  const adj: Adjacency = new Map();
  for (const n of input.nodes) adj.set(n.id, new Set());
  for (const e of input.edges) {
    if (!adj.has(e.source) || !adj.has(e.target)) continue;
    adj.get(e.source)!.add(e.target);
    // ความสัมพันธ์ถือเป็นสองทางเสมอ (แม้ directed — เพื่อการวิเคราะห์เครือข่าย)
    adj.get(e.target)!.add(e.source);
  }
  return adj;
}

/** กลุ่มที่เชื่อมถึงกัน (BFS) */
export function connectedComponents(input: AnalysisInput): ComponentInfo[] {
  const adj = buildAdjacency(input);
  const seen = new Set<string>();
  const out: ComponentInfo[] = [];

  for (const node of input.nodes) {
    if (seen.has(node.id)) continue;
    const queue = [node.id];
    const group: string[] = [];
    seen.add(node.id);
    while (queue.length) {
      const cur = queue.shift()!;
      group.push(cur);
      for (const next of adj.get(cur) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    const hubId =
      group.length === 0
        ? null
        : group.reduce((best, id) =>
            (adj.get(id)?.size ?? 0) > (adj.get(best)?.size ?? 0) ? id : best,
          );
    out.push({ index: out.length, nodeIds: group, size: group.length, hubId });
  }

  return out.sort((a, b) => b.size - a.size).map((c, i) => ({ ...c, index: i }));
}

/**
 * community ด้วยอัลกอริทึม Louvain (greedy modularity optimization)
 *
 * เลือกวิธีนี้แทน label propagation เพราะ LP มักยุบทั้งกราฟที่เชื่อมกันด้วยเส้นเดียวเป็นกลุ่มเดียว
 * Louvain จะได้กลุ่มที่มีความหนาแน่นภายในสูงจริง (เช่น 2 กลุ่มเชื่อมกันด้วย 1 เส้น → ยังแยก 2 กลุ่ม)
 */
export function detectCommunities(input: AnalysisInput): CommunityInfo[] {
  const adj = buildAdjacency(input);
  const ids = input.nodes.map((n) => n.id);
  const m2 = [...adj.entries()].reduce((sum, [, set]) => sum + set.size, 0);
  if (m2 === 0) {
    return ids.map((id, i) => ({ index: i, nodeIds: [id], size: 1, color: COMMUNITY_COLORS[i % COMMUNITY_COLORS.length]! }));
  }

  // community ปัจจุบันของแต่ละโหนด + ผลรวมดีกรีภายใน community
  const comm = new Map<string, number>(ids.map((id) => [id, ids.indexOf(id)]));
  const commTot = new Map<number, number>();
  for (const id of ids) {
    const c = comm.get(id)!;
    commTot.set(c, (commTot.get(c) ?? 0) + (adj.get(id)?.size ?? 0));
  }
  const degree = (id: string) => adj.get(id)?.size ?? 0;

  let improved = true;
  let pass = 0;
  while (improved && pass < 50) {
    improved = false;
    pass++;
    for (const id of ids) {
      const current = comm.get(id)!;
      const k = degree(id);
      const weights = new Map<number, number>();
      for (const nb of adj.get(id) ?? []) {
        const c = comm.get(nb)!;
        weights.set(c, (weights.get(c) ?? 0) + 1);
      }

      // ผลที่ได้จากการถอดโหนดออกจาก community เดิม
      commTot.set(current, (commTot.get(current) ?? 0) - k);
      let bestComm = current;
      let bestGain = (weights.get(current) ?? 0) - (k * (commTot.get(current) ?? 0)) / m2;

      for (const [c, kIn] of [...weights.entries()].sort((a, b) => a[0] - b[0])) {
        const gain = kIn - (k * (commTot.get(c) ?? 0)) / m2;
        if (gain > bestGain + 1e-12) {
          bestGain = gain;
          bestComm = c;
        }
      }

      commTot.set(bestComm, (commTot.get(bestComm) ?? 0) + k);
      if (bestComm !== current) {
        comm.set(id, bestComm);
        improved = true;
      }
    }
  }

  const groups = new Map<number, string[]>();
  for (const id of ids) {
    const c = comm.get(id)!;
    const arr = groups.get(c) ?? [];
    arr.push(id);
    groups.set(c, arr);
  }

  return [...groups.values()]
    .sort((a, b) => b.length - a.length || a[0]!.localeCompare(b[0]!))
    .map((nodeIds, i) => ({
      index: i,
      nodeIds,
      size: nodeIds.length,
      color: COMMUNITY_COLORS[i % COMMUNITY_COLORS.length]!,
    }));
}

/** จำนวนเส้นทางที่สั้นที่สุดผ่านโหนดนั้น (Brandes algorithm, ไม่ถ่วงน้ำหนัก) */
export function betweennessCentrality(input: AnalysisInput): BetweennessEntry[] {
  const adj = buildAdjacency(input);
  const nodes = input.nodes.map((n) => n.id);
  const cb = new Map<string, number>(nodes.map((id) => [id, 0]));

  for (const source of nodes) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(nodes.map((id) => [id, []]));
    const sigma = new Map<string, number>(nodes.map((id) => [id, 0]));
    const dist = new Map<string, number>(nodes.map((id) => [id, -1]));
    sigma.set(source, 1);
    dist.set(source, 0);
    const queue: string[] = [source];

    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) ?? []) {
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    const delta = new Map<string, number>(nodes.map((id) => [id, 0]));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred.get(w) ?? []) {
        const contribution = (sigma.get(v)! / (sigma.get(w) || 1)) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);
      }
      if (w !== source) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }

  // กราฟไม่กำหนดทิศทาง → หารสอง
  const labelOf = new Map(input.nodes.map((n) => [n.id, n.label]));
  return nodes
    .map((id) => ({ nodeId: id, label: labelOf.get(id) ?? id, score: Number((cb.get(id)! / 2).toFixed(3)) }))
    .sort((a, b) => b.score - a.score);
}

/** คู่ที่ไปปรากฏร่วมกันในหลายคดี */
export function findCoOccurrences(input: AnalysisInput): CoOccurrenceEntry[] {
  const suspectCases = new Map<string, Set<string>>();
  for (const e of input.edges) {
    if (e.kind !== "CO_SUSPECT" || !e.caseId) continue;
    for (const side of [e.source, e.target]) {
      if (!side.startsWith("suspect:")) continue;
      const set = suspectCases.get(side) ?? new Set<string>();
      set.add(e.caseId);
      suspectCases.set(side, set);
    }
  }

  const labelOf = new Map(input.nodes.map((n) => [n.id, n.label]));
  const entries = [...suspectCases.entries()];
  const out: CoOccurrenceEntry[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [a, setA] = entries[i]!;
      const [b, setB] = entries[j]!;
      const shared = [...setA].filter((c) => setB.has(c));
      if (shared.length < 2) continue;
      out.push({
        caseIds: shared,
        count: shared.length,
        pairs: [{ a, aLabel: labelOf.get(a) ?? a, b, bLabel: labelOf.get(b) ?? b }],
      });
    }
  }

  return out.sort((x, y) => y.count - x.count);
}

/** จุดเสี่ยง: ดีกรีสูง / เป็นตัวเชื่อมกลาง / เชื่อมข้ามเครือข่าย */
export function findRiskPoints(input: AnalysisInput): RiskPointEntry[] {
  const components = connectedComponents(input);
  const betweenness = betweennessCentrality(input);
  const betMap = new Map(betweenness.map((b) => [b.nodeId, b.score]));
  const compOf = new Map<string, number>();
  for (const c of components) for (const id of c.nodeIds) compOf.set(id, c.index);

  // นับจำนวนเครือข่ายที่โหนดนั้น "เชื่อมออกไป" (คำนวณส่วนรวมของทุกเครือข่ายไว้ตรวจ cross-links)
  const adj = buildAdjacency(input);
  const degrees = new Map(input.nodes.map((n) => [n.id, adj.get(n.id)?.size ?? 0]));
  const maxDegree = Math.max(1, ...degrees.values());

  const out: RiskPointEntry[] = [];
  for (const node of input.nodes) {
    if (node.type === "CASE") continue;
    const degree = degrees.get(node.id) ?? 0;
    if (degree === 0) continue;
    const between = betMap.get(node.id) ?? 0;
    const reasons: string[] = [];

    // โหนดที่เชื่อมกับเพื่อนบ้านที่อยู่ต่าง component = เชื่อมข้ามเครือข่าย
    const neighborComponents = new Set<number>();
    for (const nb of adj.get(node.id) ?? []) {
      const c = compOf.get(nb);
      if (c !== undefined) neighborComponents.add(c);
    }
    const ownComponent = compOf.get(node.id);
    const bridges = [...neighborComponents].filter((c) => c !== ownComponent);

    if (degree >= Math.max(3, maxDegree * 0.6)) reasons.push(`เชื่อมโยงมาก (ดีกรี ${degree})`);
    if (between > 0 && between >= betweenness[0]!.score * 0.5 && betweenness[0]!.score > 0) {
      reasons.push(`เป็นตัวเชื่อมกลาง (betweenness ${between})`);
    }
    if (bridges.length > 0) reasons.push("เชื่อมข้ามเครือข่าย");
    if (node.type === "SUSPECT" && node.riskLevel === "HIGH") reasons.push("ตั้งระดับความเสี่ยงสูงไว้แล้ว");

    if (reasons.length === 0) continue;
    // ไล่ระดับ: มี ≥2 เหตุผล = HIGH, 1 เหตุผล = MEDIUM
    // (เดิมเหตุผลเดียวได้ LOW ทำให้ hub ที่มีดีกรีสูงสุดถูกจัดเป็นความเสี่ยงต่ำ ซึ่งไม่สมเหตุผล)
    const level: RiskPointEntry["level"] = reasons.length >= 2 ? "HIGH" : "MEDIUM";
    out.push({
      nodeId: node.id,
      label: node.label,
      type: node.type,
      degree,
      betweenness: between,
      components: neighborComponents.size,
      reasons,
      level,
    });
  }

  return out.sort((a, b) => b.reasons.length - a.reasons.length || b.degree - a.degree);
}

/** ความหนาแน่นของกราฟ = 2E / (N(N-1)) */
export function graphDensity(input: AnalysisInput): number {
  const n = input.nodes.length;
  if (n < 2) return 0;
  return Number(((2 * input.edges.length) / (n * (n - 1))).toFixed(4));
}

/** ความยาวเส้นทางเฉลี่ย (BFS จากทุกโหนด เฉพาะคู่ที่เชื่อมถึงกัน) */
export function averagePathLength(input: AnalysisInput): number | null {
  const adj = buildAdjacency(input);
  const nodes = input.nodes.map((n) => n.id);
  let total = 0;
  let pairs = 0;

  for (const source of nodes) {
    const dist = new Map<string, number>([[source, 0]]);
    const queue = [source];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of adj.get(cur) ?? []) {
        if (dist.has(nb)) continue;
        dist.set(nb, dist.get(cur)! + 1);
        queue.push(nb);
      }
    }
    for (const [target, d] of dist) {
      if (target === source) continue;
      total += d;
      pairs++;
    }
  }

  return pairs === 0 ? null : Number((total / pairs).toFixed(2));
}

/** วิเคราะห์ครบชุด — ใช้ในหน้าเว็บและ API */
export function analyzeNetwork(input: AnalysisInput): NetworkAnalysis {
  const components = connectedComponents(input);
  const communities = detectCommunities(input);
  const betweenness = betweennessCentrality(input);
  const coOccurrences = findCoOccurrences(input);
  const riskPoints = findRiskPoints(input);

  return {
    components,
    communities,
    betweenness,
    coOccurrences,
    riskPoints,
    summary: {
      nodeCount: input.nodes.length,
      edgeCount: input.edges.length,
      componentCount: components.length,
      communityCount: communities.length,
      density: graphDensity(input),
      avgPathLength: averagePathLength(input),
    },
  };
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { cn } from "@/lib/cn";
import type {
  GraphEdgeDto,
  GraphNodeDto,
  InvestigationGraphDto,
  LinkKind,
  SuspectRiskLevel,
} from "@/lib/smart-police/investigation/types";
import {
  LINK_KIND_LABELS,
  LINK_KINDS,
} from "@/lib/smart-police/investigation/types";
import type { NetworkAnalysis } from "@/lib/smart-police/investigation/analyze";

const RISK_COLOR: Record<SuspectRiskLevel, string> = {
  HIGH: "#dc2626",
  MEDIUM: "#d97706",
  LOW: "#0891b2",
};

const NODE_STYLE: Record<GraphNodeDto["type"], { bg: string; border: string; shape: "round" | "diamond" | "pin" }> = {
  SUSPECT: { bg: "#ffffff", border: "#4f46e5", shape: "round" },
  CASE: { bg: "#eef2ff", border: "#1e3a8a", shape: "diamond" },
  LOCATION: { bg: "#ecfdf5", border: "#047857", shape: "pin" },
};

type FlowNodeData = {
  label: string;
  sublabel: string | null;
  kind: GraphNodeDto["type"];
  degree: number;
  riskLevel?: SuspectRiskLevel;
  raw: GraphNodeDto;
};

const NODE_W = 148;

function toFlowNodes(nodes: GraphNodeDto[]): Node<FlowNodeData>[] {
  // วาง 3 ชั้น: คดี = แกนกลางแนวตั้ง · บุคคล = วงกลาง · พิกัด = วงนอก
  // (เดิมวางคดีในวงเดียวกันกับบุคคลทำให้โหนดทับกันตรงกลาง)
  const suspects = nodes.filter((n) => n.type === "SUSPECT");
  const cases = nodes.filter((n) => n.type === "CASE");
  const locations = nodes.filter((n) => n.type === "LOCATION");
  const cx = 520;
  const cy = 380;

  return nodes.map((n) => {
    let x = cx;
    let y = cy;
    if (n.type === "CASE") {
      const i = cases.findIndex((c) => c.id === n.id);
      const total = Math.max(1, cases.length);
      // คดีวางคอลัมน์กลาง สูง/ต่ำกว่าวงบุคคล เพื่อไม่ทับเส้นหรือโหนดอื่น
      const gap = 150;
      y = cy - ((total - 1) * gap) / 2 + i * gap;
      x = cx - NODE_W / 2;
    } else if (n.type === "SUSPECT") {
      const i = suspects.findIndex((s) => s.id === n.id);
      // เยื้องมุมเริ่มต้น + กระจายสองข้าง เพื่อไม่ให้ทับแนวคดีที่วางกลางจอ
      // กระจายเป็นวงรีรอบคดีกลางจอ เว้นช่องว่างจากโหนดคดี
      const total = Math.max(1, suspects.length);
      const angle = (i / total) * Math.PI * 2 + Math.PI / 6;
      const radiusX = Math.max(320, total * 62);
      const radiusY = Math.max(215, total * 38);
      x = cx + Math.cos(angle) * radiusX - NODE_W / 2;
      y = cy + Math.sin(angle) * radiusY - 24;
    } else {
      const i = locations.findIndex((s) => s.id === n.id);
      const angle = (i / Math.max(1, locations.length)) * Math.PI * 2 - Math.PI / 2;
      x = cx + Math.cos(angle) * 460 - NODE_W / 2;
      y = cy + Math.sin(angle) * 330 - 24;
    }
    return {
      id: n.id,
      position: { x, y },
      data: {
        // ชื่อยาวตัดท้ายด้วย … เพื่อไม่ล้นกรอบ 148px
        label: n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label,
        sublabel: n.sublabel,
        kind: n.type,
        degree: n.degree,
        riskLevel: n.riskLevel,
        raw: n,
      },
      type: "default",
      width: NODE_W,
      height: 40,
      style: nodeStyle(n),
    } satisfies Node<FlowNodeData>;
  });
}

function nodeStyle(n: GraphNodeDto): React.CSSProperties {
  const theme = NODE_STYLE[n.type];
  const base: React.CSSProperties = {
    width: 148,
    minHeight: 40,
    height: 40,
    padding: "6px 8px",
    borderRadius: theme.shape === "round" ? 14 : 6,
    border: `2px solid ${theme.border}`,
    background: theme.bg,
    fontSize: 11,
    fontWeight: 700,
    color: "#1e1b4b",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(15,23,42,.12)",
  };
  if (n.type === "SUSPECT" && n.riskLevel) {
    base.borderColor = RISK_COLOR[n.riskLevel];
  }
  if (n.degree >= 4) {
    base.boxShadow = "0 0 0 3px rgba(79,70,229,.28)";
    base.fontWeight = 800;
  }
  return base;
}

function toFlowEdges(edges: GraphEdgeDto[], analysis: NetworkAnalysis | null): Edge[] {
  const betweenness = new Map((analysis?.betweenness ?? []).map((b) => [b.nodeId, b.score]));
  return edges.map((e) => {
    const strong = betweenness.get(e.source) !== undefined && (betweenness.get(e.source) ?? 0) > 0;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      // เส้น "ผู้ต้องสงสัยในคดี" มีทุกโหนดจนรก — โชว์เฉพาะตอนชี้
      label: e.kind === "CO_SUSPECT" ? undefined : e.label,
      labelShowBg: e.kind !== "CO_SUSPECT",
      animated: false,
      style: {
        stroke: e.kind === "CO_SUSPECT" ? "#c7d2fe" : strong ? "#4f46e5" : "#64748b",
        strokeWidth: e.kind === "CO_SUSPECT" ? 1 : Math.max(1.2, Math.min(3, e.weight)),
        strokeDasharray: e.kind === "CO_SUSPECT" || e.directed ? "5 4" : undefined,
      },
      labelStyle: { fontSize: 9, fill: "#475569" },
      labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
    } satisfies Edge;
  });
}

export function SmartPoliceInvestigationGraphClient({
  initialCaseId,
  fullHeight = true,
}: {
  initialCaseId?: string;
  fullHeight?: boolean;
}) {
  const [graph, setGraph] = useState<InvestigationGraphDto | null>(null);
  const [analysis, setAnalysis] = useState<NetworkAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState(initialCaseId ?? "");
  const [includeLocations, setIncludeLocations] = useState(false);
  const [selected, setSelected] = useState<GraphNodeDto | null>(null);
  const [cases, setCases] = useState<{ id: string; caseNumber: string; title: string }[]>([]);
  const [linkForm, setLinkForm] = useState<{ from: string; to: string; kind: LinkKind; weight: number }>({
    from: "",
    to: "",
    kind: "KNOWN",
    weight: 1,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (caseId) qs.set("caseId", caseId);
      if (includeLocations) qs.set("includeLocations", "1");
      const res = await fetch(`/api/smart-police/investigation/graph?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setError(res.status === 401 ? "ต้องเข้าสู่ระบบก่อน" : "โหลดผังไม่สำเร็จ");
        return;
      }
      const data = (await res.json()) as { graph: InvestigationGraphDto };
      const payload = data.graph;

      const { analyzeNetwork } = await import("@/lib/smart-police/investigation/analyze");
      const result = analyzeNetwork({ nodes: payload.nodes, edges: payload.edges });

      setGraph(payload);
      setAnalysis(result);
      setNodes(toFlowNodes(payload.nodes));
      setEdges(toFlowEdges(payload.edges, result));
    } catch {
      setError("โหลดผังไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [caseId, includeLocations, setNodes, setEdges]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/smart-police/cases", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { cases: { id: string; caseNumber: string; title: string }[] };
      setCases(data.cases ?? []);
    })();
  }, []);

  const suspectOptions = useMemo(
    () => (graph?.nodes ?? []).filter((n) => n.type === "SUSPECT"),
    [graph],
  );

  const onConnect = useCallback(
    async (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      if (!conn.source.startsWith("suspect:") || !conn.target.startsWith("suspect:")) {
        setMessage("เพิ่มเส้นเชื่อมได้เฉพาะระหว่างบุคคลต้องสงสัย");
        return;
      }
      const fromId = conn.source.slice("suspect:".length);
      const toId = conn.target.slice("suspect:".length);
      setBusy(true);
      setMessage(null);
      try {
        const res = await fetch("/api/smart-police/investigation/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromId, toId, kind: linkForm.kind, weight: linkForm.weight }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setMessage(body?.error ?? "บันทึกเส้นเชื่อมไม่สำเร็จ");
          return;
        }
        const data = (await res.json()) as { link: { id: string; label: string | null; kind: LinkKind; weight: number } };
        setEdges((eds) =>
          addEdge(
            {
              id: data.link.id,
              source: conn.source!,
              target: conn.target!,
              label: data.link.label ?? LINK_KIND_LABELS[data.link.kind],
              style: { stroke: "#4f46e5", strokeWidth: Math.max(1, data.link.weight) },
              labelStyle: { fontSize: 9, fill: "#475569" },
            },
            eds,
          ),
        );
        setMessage("เพิ่มเส้นเชื่อมแล้ว");
        void load();
      } finally {
        setBusy(false);
      }
    },
    [linkForm, setEdges, load],
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node<FlowNodeData>) => {
      setSelected(node.data.raw);
    },
    [],
  );

  return (
    <div className="space-y-3">
      {/* ---------------- toolbar ---------------- */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 px-3 py-2">
        <select
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          className="h-8 rounded-md border border-slate-300 px-2 text-xs"
          aria-label="กรองตามคดี"
        >
          <option value="">ทุกคดี</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.caseNumber} · {c.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={includeLocations}
            onChange={(e) => setIncludeLocations(e.target.checked)}
          />
          แสดงพิกัดที่อยู่
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="h-8 rounded-md border border-slate-300 px-2 text-xs font-semibold hover:bg-slate-50"
          disabled={loading}
        >
          {loading ? "กำลังโหลด…" : "รีเฟรช"}
        </button>

        {graph ? (
          <span className="ml-auto flex flex-wrap gap-3 text-[11px] font-semibold text-slate-600">
            <span>บุคคล {graph.stats.suspects}</span>
            <span>คดี {graph.stats.cases}</span>
            <span>พิกัด {graph.stats.locations}</span>
            <span>เส้น {graph.stats.links}</span>
            <span>ดีกรีเฉลี่ย {graph.stats.avgDegree}</span>
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          className={cn(
            "relative h-full w-full overflow-hidden bg-slate-50",
            fullHeight ? "min-h-[60vh]" : "min-h-[420px]",
          )}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as (c: NodeChange<Node<FlowNodeData>>[]) => void}
            onEdgesChange={onEdgesChange as (c: EdgeChange[]) => void}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={1}
              nodeBorderRadius={3}
              nodeColor={(n) => {
                const kind = (n as Node<FlowNodeData>).data?.kind;
                if (kind === "CASE") return "#1e3a8a";
                if (kind === "LOCATION") return "#047857";
                const risk = (n as Node<FlowNodeData>).data?.riskLevel;
                return risk === "HIGH" ? "#dc2626" : risk === "MEDIUM" ? "#d97706" : "#0891b2";
              }}
              style={{ width: 168, height: 116, background: "#f8fafc", border: "1px solid #cbd5e1" }}
              maskColor="rgba(226,232,240,.35)"
            />
          </ReactFlow>

          {!loading && (graph?.nodes.length ?? 0) === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-md bg-white/90 px-4 py-3 text-sm text-slate-600 shadow">
                ยังไม่มีข้อมูลผัง — เพิ่มบุคคลต้องสงสัยและเส้นเชื่อมก่อน
              </p>
            </div>
          ) : null}
        </div>

        {/* ---------------- overlay panel ---------------- */}
        <div className="pointer-events-none absolute right-2 top-2 z-10 w-64 space-y-2">
          {selected ? (
            <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 p-2 text-sm shadow-lg">
              <p className="text-[11px] font-semibold uppercase text-slate-500">
                {selected.type === "SUSPECT" ? "บุคคลต้องสงสัย" : selected.type === "CASE" ? "คดี" : "พิกัด"}
              </p>
              <p className="mt-1 text-base font-bold text-[#1e1b4b]">{selected.label}</p>
              {selected.sublabel ? <p className="text-xs text-slate-600">{selected.sublabel}</p> : null}
              <dl className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <dt className="text-slate-500">ดีกรี</dt>
                <dd className="font-semibold">{selected.degree}</dd>
                {selected.riskLevel ? (
                  <>
                    <dt className="text-slate-500">ระดับเสี่ยง</dt>
                    <dd className="font-semibold" style={{ color: RISK_COLOR[selected.riskLevel] }}>
                      {selected.riskLevel}
                    </dd>
                  </>
                ) : null}
                {selected.latitude != null ? (
                  <>
                    <dt className="text-slate-500">พิกัด</dt>
                    <dd className="font-semibold">
                      {selected.latitude.toFixed(5)}, {selected.longitude?.toFixed(5)}
                    </dd>
                  </>
                ) : null}
              </dl>
              {selected.type === "SUSPECT" ? (
                <Link
                  href={`/dashboard/smart-police/investigation/suspects/${selected.id.replace("suspect:", "")}`}
                  className="mt-2 inline-block text-xs font-semibold text-[#4d47b6] underline"
                >
                  เปิดประวัติบุคคล →
                </Link>
              ) : null}
              <button
                type="button"
                className="mt-2 block text-xs text-slate-500 underline"
                onClick={() => setSelected(null)}
              >
                ปิด
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
              คลิกโหนดเพื่อดูรายละเอียด · ลากจากโหนดหนึ่งไปอีกโหนดเพื่อเพิ่มเส้นเชื่อม
            </div>
          )}

          <details className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 p-2 shadow-lg">
            <summary className="cursor-pointer text-[11px] font-bold text-[#1e1b4b]">เส้นเชื่อม</summary>
            <div className="mt-1 space-y-2">
            <select
              className="h-8 w-full rounded-md border border-slate-300 px-2 text-xs"
              value={linkForm.kind}
              onChange={(e) => setLinkForm((f) => ({ ...f, kind: e.target.value as LinkKind }))}
            >
              {LINK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {LINK_KIND_LABELS[k]}
                </option>
              ))}
            </select>
            <label className="block text-[11px] text-slate-600">
              น้ำหนัก 1–5
              <input
                type="range"
                min={1}
                max={5}
                value={linkForm.weight}
                onChange={(e) => setLinkForm((f) => ({ ...f, weight: Number(e.target.value) }))}
                className="w-full"
              />
            </label>
            <p className="text-[11px] text-slate-500">
              ลากเส้นบนผังระหว่างบุคคล 2 คนเพื่อบันทึก ({busy ? "กำลังบันทึก…" : "พร้อม"})
            </p>
            <p className="text-[11px] text-slate-500">บุคคลในผัง: {suspectOptions.length} คน</p>
            </div>
          </details>

          {analysis ? (
            <details className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 p-2 text-xs shadow-lg">
              <summary className="cursor-pointer font-bold text-[#1e1b4b]">ผลวิเคราะห์</summary>
              <div className="mt-1 space-y-2">
              <ul className="space-y-1 text-slate-700">
                <li>เครือข่ายแยกกัน: {analysis.summary.componentCount}</li>
                <li>กลุ่มย่อย (community): {analysis.summary.communityCount}</li>
                <li>ความหนาแน่นกราฟ: {analysis.summary.density}</li>
                <li>เส้นทางเฉลี่ย: {analysis.summary.avgPathLength ?? "—"}</li>
              </ul>
              {analysis.riskPoints.length > 0 ? (
                <>
                  <p className="pt-1 font-semibold text-slate-700">จุดเสี่ยงสำคัญ</p>
                  <ul className="space-y-1">
                    {analysis.riskPoints.slice(0, 5).map((r) => (
                      <li key={r.nodeId} className="rounded bg-slate-50 p-1.5">
                        <span
                          className="mr-1 inline-block rounded px-1 text-[10px] font-bold text-white"
                          style={{ background: r.level === "HIGH" ? "#dc2626" : r.level === "MEDIUM" ? "#d97706" : "#0891b2" }}
                        >
                          {r.level}
                        </span>
                        <span className="font-semibold">{r.label}</span>
                        <span className="block text-[11px] text-slate-600">{r.reasons.join(" · ")}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {analysis.coOccurrences.length > 0 ? (
                <>
                  <p className="pt-1 font-semibold text-slate-700">คู่ที่ร่วมหลายคดี</p>
                  <ul className="space-y-0.5">
                    {analysis.coOccurrences.slice(0, 5).map((c, i) => (
                      <li key={i} className="text-[11px] text-slate-600">
                        {c.pairs[0]?.aLabel} ↔ {c.pairs[0]?.bLabel} · {c.count} คดี
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SmartPoliceInvestigationGraph(props: { initialCaseId?: string; fullHeight?: boolean }) {
  return (
    <ReactFlowProvider>
      <SmartPoliceInvestigationGraphClient {...props} />
    </ReactFlowProvider>
  );
}

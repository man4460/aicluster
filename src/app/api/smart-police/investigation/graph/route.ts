import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { LINK_KIND_LABELS } from "@/lib/smart-police/investigation/types";
import type {
  GraphEdgeDto,
  GraphNodeDto,
  InvestigationGraphDto,
  LinkKind,
  SuspectRiskLevel,
} from "@/lib/smart-police/investigation/types";

/**
 * GET /api/smart-police/investigation/graph?caseId=&includeCases=&includeLocations=
 *
 * คืน nodes + edges สำหรับวาดผังเชื่อมโยง (i2-style):
 *  - SUSPECT : บุคคลต้องสงสัย
 *  - CASE    : คดี (เชื่อมกับผู้ต้องสงสัยที่ผูกคดีนั้น)
 *  - LOCATION: พิกัดที่อยู่ (เชื่อมกับเจ้าของพิกัด)
 * edge แต่ละเส้นมี degree คำนวณฝั่ง server เพื่อให้หน้าเว็บไม่ต้องคำนวณซ้ำ
 */
export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const url = new URL(req.url);
  const caseIdFilter = (url.searchParams.get("caseId") ?? "").trim();
  const includeCases = url.searchParams.get("includeCases") !== "0";
  const includeLocations = url.searchParams.get("includeLocations") === "1";
  const ownerUserId = gate.ctx.ownerUserId;

  const suspects = await prisma.smartPoliceSuspect.findMany({
    where: {
      ownerUserId,
      status: { not: "ARCHIVED" },
      ...(caseIdFilter ? { cases: { some: { caseId: caseIdFilter } } } : {}),
    },
    include: {
      addresses: true,
      cases: { select: { caseId: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const suspectIds = new Set(suspects.map((s) => s.id));
  const caseIds = Array.from(new Set(suspects.flatMap((s) => s.cases.map((c) => c.caseId))));

  const cases = includeCases && caseIds.length
    ? await prisma.smartPoliceCase.findMany({
        where: { ownerUserId, id: { in: caseIds } },
        select: { id: true, caseNumber: true, title: true, caseType: true },
      })
    : [];

  const links = await prisma.smartPoliceLink.findMany({
    where: {
      ownerUserId,
      fromId: { in: Array.from(suspectIds) },
      toId: { in: Array.from(suspectIds) },
    },
    orderBy: { createdAt: "asc" },
  });

  // ---- nodes ----
  const nodes: GraphNodeDto[] = [];
  const degree = new Map<string, number>();
  const bump = (id: string, n = 1) => degree.set(id, (degree.get(id) ?? 0) + n);

  for (const s of suspects) {
    nodes.push({
      id: `suspect:${s.id}`,
      type: "SUSPECT",
      label: s.fullName,
      sublabel: s.alias ?? s.nickname ?? null,
      degree: 0,
      riskLevel: s.riskLevel as SuspectRiskLevel,
    });
  }

  for (const c of cases) {
    nodes.push({
      id: `case:${c.id}`,
      type: "CASE",
      label: c.caseNumber,
      sublabel: c.title,
      degree: 0,
      caseNumber: c.caseNumber,
    });
  }

  const locationNodes = new Map<string, GraphNodeDto>();
  if (includeLocations) {
    for (const s of suspects) {
      for (const a of s.addresses) {
        if (a.latitude === null || a.longitude === null) continue;
        const id = `location:${a.id}`;
        if (!locationNodes.has(id)) {
          locationNodes.set(id, {
            id,
            type: "LOCATION",
            label: a.label ?? a.address.slice(0, 40),
            sublabel: a.kind,
            degree: 0,
            latitude: a.latitude,
            longitude: a.longitude,
          });
        }
      }
    }
    nodes.push(...locationNodes.values());
  }

  // ---- edges ----
  const edges: GraphEdgeDto[] = [];

  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const l of links) {
    const source = `suspect:${l.fromId}`;
    const target = `suspect:${l.toId}`;
    // ต้องเช็กกับรายการ node จริง (เดิมเช็ก degree ซึ่งยังว่างตอนนี้ ทำให้เส้นหายหมด)
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
    const kind = l.kind as LinkKind;
    edges.push({
      id: l.id,
      source,
      target,
      kind,
      label: l.label ?? LINK_KIND_LABELS[kind] ?? kind,
      weight: l.weight,
      directed: l.directed,
      caseId: l.caseId,
    });
    bump(source);
    bump(target);
  }

  // ผู้ต้องสงสัย ↔ คดี
  // วาดเป็นเส้นเฉพาะคดีที่ผู้ต้องสงสัยไม่เกิน 3 คน — คดีที่คนเยอะจะกลายเป็นเส้นรวมศูนย์ที่อ่านไม่ออก
  // (ดีกรียังนับครบทุกคดี เพื่อให้การวิเคราะห์เครือข่ายถูกต้อง)
  const caseFanout = new Map<string, number>();
  for (const s of suspects) {
    for (const c of s.cases) caseFanout.set(c.caseId, (caseFanout.get(c.caseId) ?? 0) + 1);
  }
  for (const s of suspects) {
    for (const c of s.cases) {
      const source = `suspect:${s.id}`;
      const target = `case:${c.caseId}`;
      if (!nodes.some((n) => n.id === target)) continue;
      bump(source);
      bump(target);
      if ((caseFanout.get(c.caseId) ?? 0) > 3) continue;
      edges.push({
        id: `suspect_case:${s.id}:${c.caseId}`,
        source,
        target,
        kind: "CO_SUSPECT",
        label: "ผู้ต้องสงสัยในคดี",
        weight: 1,
        directed: false,
        caseId: c.caseId,
      });
    }
  }

  // ที่อยู่ ↔ เจ้าของ
  if (includeLocations) {
    for (const s of suspects) {
      for (const a of s.addresses) {
        const source = `suspect:${s.id}`;
        const target = `location:${a.id}`;
        if (!locationNodes.has(target)) continue;
        edges.push({
          id: `suspect_location:${s.id}:${a.id}`,
          source,
          target,
          kind: "OTHER",
          label: a.kind,
          weight: 1,
          directed: false,
          caseId: null,
        });
        bump(source);
        bump(target);
      }
    }
  }

  // ---- attach degree ----
  for (const n of nodes) n.degree = degree.get(n.id) ?? 0;

  const topHubs = [...nodes]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10)
    .map((n) => ({ id: n.id, label: n.label, degree: n.degree }));

  const totalDegree = nodes.reduce((sum, n) => sum + n.degree, 0);
  const payload: InvestigationGraphDto = {
    nodes,
    edges,
    stats: {
      suspects: nodes.filter((n) => n.type === "SUSPECT").length,
      cases: nodes.filter((n) => n.type === "CASE").length,
      locations: nodes.filter((n) => n.type === "LOCATION").length,
      links: edges.length,
      avgDegree: nodes.length ? Number((totalDegree / nodes.length).toFixed(2)) : 0,
      topHubs,
    },
  };

  return NextResponse.json({ graph: payload });
}

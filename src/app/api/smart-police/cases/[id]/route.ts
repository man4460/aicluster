import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";
import type {
  SmartPoliceCasePriority,
  SmartPoliceCaseStatus,
  SmartPoliceCustodyMode,
  SmartPoliceInvestigationResult,
} from "@/generated/prisma/enums";

const CASE_INCLUDE = { parties: true, documents: true, evidence: true } as const;

async function loadOwnedCase(ownerUserId: string, id: string) {
  return prisma.smartPoliceCase.findFirst({
    where: { id, ownerUserId },
    include: CASE_INCLUDE,
  });
}

function parseDateOrNull(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const row = await loadOwnedCase(gate.ctx.ownerUserId, id);
  if (!row) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });
  return NextResponse.json({ case: mapSmartPoliceCaseDetail(row) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const existing = await loadOwnedCase(gate.ctx.ownerUserId, id);
  if (!existing) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim() || existing.title;
  if (typeof body.caseType === "string") data.caseType = body.caseType.trim() || existing.caseType;
  if (typeof body.status === "string") {
    const s = body.status as SmartPoliceCaseStatus;
    if (["OPEN", "IN_PROGRESS", "CLOSED"].includes(s)) data.status = s;
  }
  if (typeof body.priority === "string") {
    const p = body.priority as SmartPoliceCasePriority;
    if (["LOW", "NORMAL", "HIGH", "URGENT"].includes(p)) data.priority = p;
  }
  if (body.incidentPlace !== undefined) {
    data.incidentPlace = typeof body.incidentPlace === "string" ? body.incidentPlace.trim() || null : null;
  }
  if (body.summary !== undefined) {
    data.summary = typeof body.summary === "string" ? body.summary.trim() || null : null;
  }
  const incidentAt = parseDateOrNull(body.incidentAt);
  if (incidentAt !== undefined) data.incidentAt = incidentAt;

  if (body.courtType !== undefined) {
    data.courtType = typeof body.courtType === "string" ? body.courtType.trim() || null : null;
  }
  if (body.chargeText !== undefined) {
    data.chargeText = typeof body.chargeText === "string" ? body.chargeText.trim() || null : null;
  }
  if (body.lawRefs !== undefined) {
    data.lawRefs = typeof body.lawRefs === "string" ? body.lawRefs.trim() || null : null;
  }
  const receivedAt = parseDateOrNull(body.receivedAt);
  if (receivedAt !== undefined) data.receivedAt = receivedAt;
  if (body.receivedTimeHm !== undefined) {
    data.receivedTimeHm =
      typeof body.receivedTimeHm === "string" ? body.receivedTimeHm.trim() || null : null;
  }
  if (body.dailyLogNo !== undefined) {
    data.dailyLogNo = typeof body.dailyLogNo === "string" ? body.dailyLogNo.trim() || null : null;
  }
  if (typeof body.custodyMode === "string") {
    const m = body.custodyMode as SmartPoliceCustodyMode;
    if (
      ["DETAIN_REMAND", "NOT_ARRESTED", "UNKNOWN", "SURRENDER_RELEASE", "SURRENDER_DETAIN", "OTHER"].includes(
        m,
      )
    ) {
      data.custodyMode = m;
    }
  } else if (body.custodyMode === null) {
    data.custodyMode = null;
  }
  if (body.investigatorOfficerId !== undefined) {
    const oid =
      typeof body.investigatorOfficerId === "string" ? body.investigatorOfficerId.trim() || null : null;
    if (oid) {
      const off = await prisma.smartPoliceOfficer.findFirst({
        where: { id: oid, ownerUserId: gate.ctx.ownerUserId },
      });
      data.investigatorOfficerId = off ? oid : null;
    } else {
      data.investigatorOfficerId = null;
    }
  }
  if (typeof body.investigationResult === "string") {
    const r = body.investigationResult as SmartPoliceInvestigationResult;
    if (["INVESTIGATING", "PROSECUTE", "NOT_PROSECUTE"].includes(r)) data.investigationResult = r;
  }
  const sentAt = parseDateOrNull(body.sentToProsecutorAt);
  if (sentAt !== undefined) data.sentToProsecutorAt = sentAt;
  if (body.behaviorText !== undefined) {
    data.behaviorText = typeof body.behaviorText === "string" ? body.behaviorText.trim() || null : null;
  }
  if (body.damageNote !== undefined) {
    data.damageNote = typeof body.damageNote === "string" ? body.damageNote.trim() || null : null;
  }
  const detainAt = parseDateOrNull(body.detainAt);
  if (detainAt !== undefined) data.detainAt = detainAt;

  const updated = await prisma.smartPoliceCase.update({
    where: { id },
    data,
    include: CASE_INCLUDE,
  });
  return NextResponse.json({ case: mapSmartPoliceCaseDetail(updated) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;
  const existing = await loadOwnedCase(gate.ctx.ownerUserId, id);
  if (!existing) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });
  await prisma.smartPoliceCase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

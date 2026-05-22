import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceCaseDetail } from "@/lib/smart-police/serialize";
import type { SmartPoliceCaseStatus } from "@/generated/prisma/enums";

async function loadOwnedCase(ownerUserId: string, id: string) {
  return prisma.smartPoliceCase.findFirst({
    where: { id, ownerUserId },
    include: { parties: true, documents: true },
  });
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
  if (body.incidentPlace !== undefined) {
    data.incidentPlace = typeof body.incidentPlace === "string" ? body.incidentPlace.trim() || null : null;
  }
  if (body.summary !== undefined) {
    data.summary = typeof body.summary === "string" ? body.summary.trim() || null : null;
  }
  if (body.incidentAt !== undefined) {
    if (body.incidentAt === null || body.incidentAt === "") data.incidentAt = null;
    else if (typeof body.incidentAt === "string") {
      const d = new Date(body.incidentAt);
      data.incidentAt = Number.isNaN(d.getTime()) ? existing.incidentAt : d;
    }
  }

  const updated = await prisma.smartPoliceCase.update({
    where: { id },
    data,
    include: { parties: true, documents: true },
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

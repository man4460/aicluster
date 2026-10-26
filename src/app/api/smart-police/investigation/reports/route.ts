import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapInvestigationReport } from "@/lib/smart-police/investigation/serialize";

/** GET /api/smart-police/investigation/reports?caseId=&limit= */
export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const url = new URL(req.url);
  const caseId = (url.searchParams.get("caseId") ?? "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 100, 300);

  const rows = await prisma.smartPoliceInvestigationReport.findMany({
    where: { ownerUserId: gate.ctx.ownerUserId, ...(caseId ? { caseId } : {}) },
    orderBy: { reportedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ reports: rows.map(mapInvestigationReport), total: rows.length });
}

/** POST /api/smart-police/investigation/reports */
export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (!title) return NextResponse.json({ error: "ต้องระบุชื่อรายงาน" }, { status: 400 });

  const caseId = typeof body?.caseId === "string" && body.caseId ? body.caseId : null;
  if (caseId) {
    const c = await prisma.smartPoliceCase.findFirst({
      where: { id: caseId, ownerUserId: gate.ctx.ownerUserId },
      select: { id: true },
    });
    if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });
  }

  const reportedRaw = text(body?.reportedAt);
  const reportedAt = reportedRaw ? new Date(reportedRaw) : new Date();
  if (Number.isNaN(reportedAt.getTime())) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const created = await prisma.smartPoliceInvestigationReport.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      caseId,
      title,
      reportNo: text(body?.reportNo) || null,
      reportedAt,
      officerName: text(body?.officerName) || null,
      summary: text(body?.summary) || null,
      body: text(body?.body),
      finding: text(body?.finding) || null,
      attachmentUrl: text(body?.attachmentUrl) || null,
    },
  });

  return NextResponse.json({ report: mapInvestigationReport(created) }, { status: 201 });
}

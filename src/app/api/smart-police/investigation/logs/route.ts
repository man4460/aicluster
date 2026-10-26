import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapInvestigationLog } from "@/lib/smart-police/investigation/serialize";
import { LOG_ACTIVITIES } from "@/lib/smart-police/investigation/types";

const INCLUDE = { suspect: { select: { fullName: true } } } as const;

/** GET /api/smart-police/investigation/logs?caseId=&suspectId=&limit= */
export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const url = new URL(req.url);
  const caseId = (url.searchParams.get("caseId") ?? "").trim();
  const suspectId = (url.searchParams.get("suspectId") ?? "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 500);

  const rows = await prisma.smartPoliceInvestigationLog.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(caseId ? { caseId } : {}),
      ...(suspectId ? { suspectId } : {}),
    },
    include: INCLUDE,
    orderBy: { occurredAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs: rows.map(mapInvestigationLog), total: rows.length });
}

/** POST /api/smart-police/investigation/logs */
export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const result = typeof body?.result === "string" ? body.result.trim() : "";
  const occurredRaw = typeof body?.occurredAt === "string" ? body.occurredAt : "";
  const occurredAt = occurredRaw ? new Date(occurredRaw) : new Date();
  if (!result) return NextResponse.json({ error: "ต้องระบุผลการลงพื้นที่" }, { status: 400 });
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const activity = typeof body?.activity === "string" && LOG_ACTIVITIES.includes(body.activity as never)
    ? (body.activity as string)
    : "SUMMARY";
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const caseId = typeof body?.caseId === "string" && body.caseId ? body.caseId : null;
  const suspectId = typeof body?.suspectId === "string" && body.suspectId ? body.suspectId : null;

  if (caseId) {
    const c = await prisma.smartPoliceCase.findFirst({
      where: { id: caseId, ownerUserId: gate.ctx.ownerUserId },
      select: { id: true },
    });
    if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });
  }
  if (suspectId) {
    const s = await prisma.smartPoliceSuspect.findFirst({
      where: { id: suspectId, ownerUserId: gate.ctx.ownerUserId },
      select: { id: true },
    });
    if (!s) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });
  }

  const created = await prisma.smartPoliceInvestigationLog.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      caseId,
      suspectId,
      occurredAt,
      place: typeof body?.place === "string" && body.place.trim() ? body.place.trim() : null,
      latitude: num(body?.latitude),
      longitude: num(body?.longitude),
      officerName:
        typeof body?.officerName === "string" && body.officerName.trim() ? body.officerName.trim() : null,
      activity,
      result,
    },
    include: INCLUDE,
  });

  return NextResponse.json({ log: mapInvestigationLog(created) }, { status: 201 });
}

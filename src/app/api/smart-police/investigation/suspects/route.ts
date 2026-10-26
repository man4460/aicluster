import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceSuspect } from "@/lib/smart-police/investigation/serialize";
import { SUSPECT_RISK_LEVELS, SUSPECT_STATUSES } from "@/lib/smart-police/investigation/types";

/** GET /api/smart-police/investigation/suspects?q=&status=&risk=&limit= */
export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = (url.searchParams.get("status") ?? "").trim();
  const risk = (url.searchParams.get("risk") ?? "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 500);

  const rows = await prisma.smartPoliceSuspect.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(status && SUSPECT_STATUSES.includes(status as never) ? { status } : {}),
      ...(risk && SUSPECT_RISK_LEVELS.includes(risk as never) ? { riskLevel: risk } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { alias: { contains: q } },
              { nickname: { contains: q } },
              { nationalId: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      addresses: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
      cases: { select: { caseId: true } },
      _count: { select: { linksFrom: true, linksTo: true, logs: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({ suspects: rows.map(mapSmartPoliceSuspect), total: rows.length });
}

type SuspectBody = {
  fullName?: unknown;
  alias?: unknown;
  nickname?: unknown;
  nationalId?: unknown;
  birthDate?: unknown;
  gender?: unknown;
  phone?: unknown;
  occupation?: unknown;
  photoUrl?: unknown;
  description?: unknown;
  riskLevel?: unknown;
  status?: unknown;
  notes?: unknown;
  caseIds?: unknown;
};

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

/** POST /api/smart-police/investigation/suspects */
export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const body = (await req.json().catch(() => null)) as SuspectBody | null;
  const fullName = str(body?.fullName);
  if (!body || !fullName) {
    return NextResponse.json({ error: "ต้องระบุชื่อ-นามสกุล" }, { status: 400 });
  }

  const riskLevel = str(body.riskLevel) ?? "MEDIUM";
  const status = str(body.status) ?? "ACTIVE";
  if (!SUSPECT_RISK_LEVELS.includes(riskLevel as never)) {
    return NextResponse.json({ error: "riskLevel ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!SUSPECT_STATUSES.includes(status as never)) {
    return NextResponse.json({ error: "status ไม่ถูกต้อง" }, { status: 400 });
  }

  const caseIds = Array.isArray(body.caseIds)
    ? body.caseIds.filter((x): x is string => typeof x === "string" && Boolean(x))
    : [];

  const birthRaw = str(body.birthDate);
  const birthDate = birthRaw ? new Date(birthRaw) : null;

  const created = await prisma.smartPoliceSuspect.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      fullName,
      alias: str(body.alias),
      nickname: str(body.nickname),
      nationalId: str(body.nationalId),
      birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
      gender: str(body.gender),
      phone: str(body.phone),
      occupation: str(body.occupation),
      photoUrl: str(body.photoUrl),
      description: str(body.description),
      riskLevel,
      status,
      notes: str(body.notes),
      ...(caseIds.length
        ? {
            cases: {
              create: await caseLinksFor(gate.ctx.ownerUserId, caseIds),
            },
          }
        : {}),
    },
    include: {
      addresses: true,
      photos: { orderBy: { createdAt: "asc" } },
      cases: { select: { caseId: true } },
      _count: { select: { linksFrom: true, linksTo: true, logs: true } },
    },
  });

  return NextResponse.json({ suspect: mapSmartPoliceSuspect(created) }, { status: 201 });
}

async function caseLinksFor(ownerUserId: string, caseIds: string[]) {
  const cases = await prisma.smartPoliceCase.findMany({
    where: { id: { in: caseIds }, ownerUserId },
    select: { id: true },
  });
  return cases.map((c) => ({ caseId: c.id }));
}

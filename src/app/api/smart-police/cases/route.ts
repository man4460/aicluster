import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { nextSmartPoliceCaseNumber } from "@/lib/smart-police/case-number";
import { mapSmartPoliceCaseListItem } from "@/lib/smart-police/serialize";
import type { SmartPoliceCaseStatus } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = url.searchParams.get("status") as SmartPoliceCaseStatus | null;

  const rows = await prisma.smartPoliceCase.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { caseNumber: { contains: q } },
              { title: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { _count: { select: { parties: true, documents: true } } },
  });

  return NextResponse.json({
    cases: rows.map(mapSmartPoliceCaseListItem),
  });
}

export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "กรุณาระบุชื่อเรื่องคดี" }, { status: 400 });
  }

  const profile = await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  const caseNumber =
    typeof body.caseNumber === "string" && body.caseNumber.trim()
      ? body.caseNumber.trim()
      : await nextSmartPoliceCaseNumber(prisma, gate.ctx.ownerUserId, profile.caseNumberPrefix);

  const dup = await prisma.smartPoliceCase.findUnique({
    where: {
      ownerUserId_caseNumber: { ownerUserId: gate.ctx.ownerUserId, caseNumber },
    },
  });
  if (dup) {
    return NextResponse.json({ error: "เลขคดีซ้ำ" }, { status: 409 });
  }

  const incidentAt =
    typeof body.incidentAt === "string" && body.incidentAt
      ? new Date(body.incidentAt)
      : null;

  const created = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      caseNumber,
      title,
      caseType: typeof body.caseType === "string" ? body.caseType.trim() || "คดีอาญา" : "คดีอาญา",
      status: "OPEN",
      incidentAt: incidentAt && !Number.isNaN(incidentAt.getTime()) ? incidentAt : null,
      incidentPlace: typeof body.incidentPlace === "string" ? body.incidentPlace.trim() || null : null,
      summary: typeof body.summary === "string" ? body.summary.trim() || null : null,
    },
    include: { _count: { select: { parties: true, documents: true } } },
  });

  return NextResponse.json({ case: mapSmartPoliceCaseListItem(created) }, { status: 201 });
}

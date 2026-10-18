import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { nextSmartPoliceCaseNumber } from "@/lib/smart-police/case-number";
import { generateSmartPoliceDocs } from "@/lib/smart-police/generate-docs";
import { mapSmartPoliceCaseDetail, mapSmartPoliceCaseListItem } from "@/lib/smart-police/serialize";
import { appOriginFromRequest } from "@/lib/smart-police/word-file";
import { bangkokDateKey, formatBangkokTimeHm } from "@/lib/time/bangkok";
import type {
  SmartPoliceCasePriority,
  SmartPoliceCaseStatus,
  SmartPolicePartyRole,
} from "@/generated/prisma/enums";

const CASE_LIST_INCLUDE = {
  parties: { select: { role: true, fullName: true, sortOrder: true } },
  _count: { select: { parties: true, documents: true } },
} as const;
const CASE_DETAIL_INCLUDE = { parties: true, documents: true, evidence: true } as const;

const PRIORITIES: SmartPoliceCasePriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const PARTY_ROLES: SmartPolicePartyRole[] = [
  "COMPLAINANT",
  "SUSPECT",
  "WITNESS",
  "OFFICER",
  "OTHER",
];

export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = url.searchParams.get("status") as SmartPoliceCaseStatus | null;
  const priority = url.searchParams.get("priority") as SmartPoliceCasePriority | null;
  const prosecutor = url.searchParams.get("prosecutor"); // sent | pending | ""

  const rows = await prisma.smartPoliceCase.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(status ? { status } : {}),
      ...(priority && PRIORITIES.includes(priority) ? { priority } : {}),
      ...(prosecutor === "sent"
        ? { sentToProsecutorAt: { not: null } }
        : prosecutor === "pending"
          ? { sentToProsecutorAt: null }
          : {}),
      ...(q
        ? {
            OR: [
              { caseNumber: { contains: q } },
              { title: { contains: q } },
              { chargeText: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 200,
    include: CASE_LIST_INCLUDE,
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
  const bootstrap = body.bootstrap === true;

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

  let receivedAt: Date | null = null;
  if (typeof body.receivedAt === "string" && body.receivedAt.trim()) {
    const raw = body.receivedAt.trim();
    const d = raw.includes("T")
      ? new Date(raw)
      : new Date(`${raw.slice(0, 10)}T12:00:00+07:00`);
    if (!Number.isNaN(d.getTime())) receivedAt = d;
  } else if (bootstrap) {
    receivedAt = new Date(`${bangkokDateKey()}T12:00:00+07:00`);
  }

  const receivedTimeHm =
    typeof body.receivedTimeHm === "string" && body.receivedTimeHm.trim()
      ? body.receivedTimeHm.trim()
      : bootstrap
        ? formatBangkokTimeHm()
        : null;

  const priorityRaw =
    typeof body.priority === "string" ? (body.priority as SmartPoliceCasePriority) : "NORMAL";
  const priority = PRIORITIES.includes(priorityRaw) ? priorityRaw : "NORMAL";

  const chargeText =
    typeof body.chargeText === "string" ? body.chargeText.trim() || null : null;
  const lawRefs = typeof body.lawRefs === "string" ? body.lawRefs.trim() || null : null;

  const partiesInput = Array.isArray(body.parties) ? body.parties : [];
  if (bootstrap) {
    const hasComplainant = partiesInput.some(
      (p) =>
        p &&
        typeof p === "object" &&
        (p as { role?: string }).role === "COMPLAINANT" &&
        typeof (p as { fullName?: string }).fullName === "string" &&
        (p as { fullName: string }).fullName.trim(),
    );
    const hasSuspect = partiesInput.some(
      (p) =>
        p &&
        typeof p === "object" &&
        (p as { role?: string }).role === "SUSPECT" &&
        typeof (p as { fullName?: string }).fullName === "string" &&
        (p as { fullName: string }).fullName.trim(),
    );
    if (!hasComplainant || !hasSuspect) {
      return NextResponse.json(
        { error: "วิซาร์ดต้องระบุผู้กล่าวหาและผู้ต้องหาอย่างน้อยอย่างละ 1 คน" },
        { status: 400 },
      );
    }
  }

  const created = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      caseNumber,
      title: chargeText || title,
      caseType: typeof body.caseType === "string" ? body.caseType.trim() || "คดีอาญา" : "คดีอาญา",
      status: "OPEN",
      priority,
      incidentAt: incidentAt && !Number.isNaN(incidentAt.getTime()) ? incidentAt : null,
      incidentPlace: typeof body.incidentPlace === "string" ? body.incidentPlace.trim() || null : null,
      summary: typeof body.summary === "string" ? body.summary.trim() || null : null,
      chargeText,
      lawRefs,
      receivedAt,
      receivedTimeHm,
      parties:
        partiesInput.length > 0
          ? {
              create: partiesInput
                .map((raw, idx) => {
                  if (!raw || typeof raw !== "object") return null;
                  const p = raw as Record<string, unknown>;
                  const fullName = typeof p.fullName === "string" ? p.fullName.trim() : "";
                  if (!fullName) return null;
                  const roleRaw = typeof p.role === "string" ? (p.role as SmartPolicePartyRole) : "OTHER";
                  const role = PARTY_ROLES.includes(roleRaw) ? roleRaw : "OTHER";
                  return {
                    role,
                    fullName,
                    caseRelation:
                      typeof p.caseRelation === "string" ? p.caseRelation.trim() || null : null,
                    age: typeof p.age === "number" ? p.age : null,
                    idCard: typeof p.idCard === "string" ? p.idCard.trim() || null : null,
                    address: typeof p.address === "string" ? p.address.trim() || null : null,
                    sortOrder: idx,
                  };
                })
                .filter((x): x is NonNullable<typeof x> => Boolean(x)),
            }
          : undefined,
    },
    include: CASE_DETAIL_INCLUDE,
  });

  if (bootstrap && body.generateDay1 !== false) {
    try {
      await generateSmartPoliceDocs({
        ownerUserId: gate.ctx.ownerUserId,
        caseId: created.id,
        kinds: ["MEMO", "STATEMENT_ALL", "PROPERTY_LIST"],
        appOrigin: appOriginFromRequest(req),
        generateWord: true,
        syncNarrative: true,
      });
    } catch {
      // คดีสร้างแล้ว — ให้ผู้ใช้สร้างเอกสารซ้ำจาก checklist ได้
    }
  }

  const refreshed = await prisma.smartPoliceCase.findFirst({
    where: { id: created.id },
    include: CASE_DETAIL_INCLUDE,
  });

  return NextResponse.json(
    {
      case: refreshed
        ? mapSmartPoliceCaseDetail(refreshed)
        : mapSmartPoliceCaseListItem({
            ...created,
            _count: { parties: created.parties.length, documents: created.documents.length },
          }),
    },
    { status: 201 },
  );
}

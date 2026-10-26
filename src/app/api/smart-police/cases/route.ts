import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import type { SmartPoliceCustodyMode } from "@/generated/prisma/enums";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { nextSmartPoliceCaseNumber } from "@/lib/smart-police/case-number";
import { generateSmartPoliceDocs } from "@/lib/smart-police/generate-docs";
import { ensureSmartPoliceCasePresets } from "@/lib/smart-police/case-presets/ensure-builtin";
import { SMART_POLICE_OFFICIAL_FORM_TEMPLATES } from "@/lib/smart-police/form-templates/official-form-catalog";
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
  const statusRaw = (url.searchParams.get("status") ?? "").trim();
  const priorityRaw = (url.searchParams.get("priority") ?? "").trim();
  const prosecutor = url.searchParams.get("prosecutor"); // sent | pending | ""
  const overdueOnly = url.searchParams.get("overdue") === "1";

  /** status=active → เปิด + สอบสวน · priority=elevated → ด่วน + สูง */
  const statusFilter =
    statusRaw === "active"
      ? ({ in: ["OPEN", "IN_PROGRESS"] as SmartPoliceCaseStatus[] } as const)
      : statusRaw && ["OPEN", "IN_PROGRESS", "CLOSED"].includes(statusRaw)
        ? (statusRaw as SmartPoliceCaseStatus)
        : undefined;
  const priorityFilter =
    priorityRaw === "elevated"
      ? ({ in: ["HIGH", "URGENT"] as SmartPoliceCasePriority[] } as const)
      : priorityRaw && PRIORITIES.includes(priorityRaw as SmartPoliceCasePriority)
        ? (priorityRaw as SmartPoliceCasePriority)
        : undefined;

  const rows = await prisma.smartPoliceCase.findMany({
    where: {
      ownerUserId: gate.ctx.ownerUserId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(priorityFilter ? { priority: priorityFilter } : {}),
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

  let cases = rows.map(mapSmartPoliceCaseListItem);
  if (overdueOnly) {
    cases = cases.filter((c) => c.overdue);
  }

  return NextResponse.json({ cases });
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

  // แม่แบบตั้งต้นคดี (ไม่บังคับ): เติมข้อหา/ศาล/วิธีควบคุมตัว + สร้างรายการเอกสารตั้งต้น
  let preset: {
    defaultChargeText: string;
    defaultLawRefs: string | null;
    defaultCourtType: string | null;
    defaultCustodyMode: string | null;
    formSlugs: string;
    caseType: string;
  } | null = null;
  const presetId = typeof body.presetId === "string" ? body.presetId.trim() : "";
  const presetKey = typeof body.presetKey === "string" ? body.presetKey.trim() : "";
  if (presetId || presetKey) {
    await ensureSmartPoliceCasePresets(gate.ctx.ownerUserId);
    preset = await prisma.smartPoliceCasePreset.findFirst({
      where: {
        ownerUserId: gate.ctx.ownerUserId,
        ...(presetId ? { id: presetId } : { key: presetKey }),
      },
      select: {
        defaultChargeText: true,
        defaultLawRefs: true,
        defaultCourtType: true,
        defaultCustodyMode: true,
        formSlugs: true,
        caseType: true,
      },
    });
    if (!preset) {
      return NextResponse.json({ error: "ไม่พบแม่แบบคดี" }, { status: 404 });
    }
  }

  const resolvedChargeText = chargeText ?? preset?.defaultChargeText ?? null;
  const resolvedLawRefs = lawRefs ?? preset?.defaultLawRefs ?? null;

  const created = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      caseNumber,
      title,
      caseType:
        (typeof body.caseType === "string" ? body.caseType.trim() : "") ||
        preset?.caseType ||
        "คดีอาญา",
      courtType: preset?.defaultCourtType ?? null,
      custodyMode: (preset?.defaultCustodyMode ?? null) as SmartPoliceCustodyMode | null,
      status: "OPEN",
      priority,
      incidentAt: incidentAt && !Number.isNaN(incidentAt.getTime()) ? incidentAt : null,
      incidentPlace: typeof body.incidentPlace === "string" ? body.incidentPlace.trim() || null : null,
      summary: typeof body.summary === "string" ? body.summary.trim() || null : null,
      chargeText: resolvedChargeText,
      lawRefs: resolvedLawRefs,
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

  // สร้างรายการเอกสารตั้งต้นตาม preset (title ตามแคตตาล็อกฟอร์ม, content ว่างให้กรอกในหน้า preview)
  if (preset) {
    try {
      const slugs = JSON.parse(preset.formSlugs) as string[];
      const bySlug = new Map(
        SMART_POLICE_OFFICIAL_FORM_TEMPLATES.map((t) => [t.slug as string, t]),
      );
      const rows = slugs
        .map((slug, idx) => {
          const meta = bySlug.get(slug);
          if (!meta) return null;
          return {
            caseId: created.id,
            kind: "OTHER" as const,
            title: meta.title,
            content: "",
            sortOrder: idx,
          };
        })
        .filter((r): r is NonNullable<typeof r> => Boolean(r));
      if (rows.length > 0) {
        await prisma.smartPoliceDocument.createMany({ data: rows });
      }
    } catch {
      // คดีถูกสร้างแล้ว — สร้างเอกสารซ้ำจาก checklist ได้
    }
  }

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

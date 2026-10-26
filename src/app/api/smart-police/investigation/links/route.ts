import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapLink } from "@/lib/smart-police/investigation/serialize";
import { LINK_KINDS } from "@/lib/smart-police/investigation/types";

const INCLUDE = { from: true, to: true } as const;

/** GET /api/smart-police/investigation/links */
export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const url = new URL(req.url);
  const fromId = (url.searchParams.get("fromId") ?? "").trim();

  const rows = await prisma.smartPoliceLink.findMany({
    where: { ownerUserId: gate.ctx.ownerUserId, ...(fromId ? { fromId } : {}) },
    include: INCLUDE,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ links: rows.map(mapLink), total: rows.length });
}

/** POST /api/smart-police/investigation/links — เพิ่มเส้นเชื่อมระหว่างบุคคลต้องสงสัย */
export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const fromId = typeof body?.fromId === "string" ? body.fromId : "";
  const toId = typeof body?.toId === "string" ? body.toId : "";
  if (!fromId || !toId) return NextResponse.json({ error: "ต้องระบุบุคคลต้นทางและปลายทาง" }, { status: 400 });
  if (fromId === toId) return NextResponse.json({ error: "เชื่อมโยงบุคคลเดียวกันไม่ได้" }, { status: 400 });

  const kind = typeof body?.kind === "string" && LINK_KINDS.includes(body.kind as never)
    ? (body.kind as string)
    : "KNOWN";
  const pair = await prisma.smartPoliceSuspect.findMany({
    where: { id: { in: [fromId, toId] }, ownerUserId: gate.ctx.ownerUserId },
    select: { id: true },
  });
  if (pair.length !== 2) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });

  const clamp = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (!Number.isFinite(n)) return fallback;
    return Math.max(1, Math.min(5, Math.round(n)));
  };

  const created = await prisma.smartPoliceLink.upsert({
    where: {
      ownerUserId_fromId_toId_kind: {
        ownerUserId: gate.ctx.ownerUserId,
        fromId,
        toId,
        kind,
      },
    },
    create: {
      ownerUserId: gate.ctx.ownerUserId,
      fromId,
      toId,
      kind,
      label: typeof body?.label === "string" && body.label.trim() ? body.label.trim() : null,
      directed: Boolean(body?.directed),
      weight: clamp(body?.weight, 1),
      strength: clamp(body?.strength, 1),
      caseId: typeof body?.caseId === "string" && body.caseId ? body.caseId : null,
      notes: typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
    update: {
      label: typeof body?.label === "string" && body.label.trim() ? body.label.trim() : undefined,
      weight: clamp(body?.weight, 1),
      strength: clamp(body?.strength, 1),
      notes: typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
    },
    include: INCLUDE,
  });

  return NextResponse.json({ link: mapLink(created) }, { status: 201 });
}

/** DELETE /api/smart-police/investigation/links?id= */
export async function DELETE(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const id = (new URL(req.url).searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });

  const row = await prisma.smartPoliceLink.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
    select: { id: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบเส้นเชื่อม" }, { status: 404 });

  await prisma.smartPoliceLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

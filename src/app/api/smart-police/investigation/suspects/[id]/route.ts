import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSmartPoliceSuspect } from "@/lib/smart-police/investigation/serialize";

const INCLUDE = {
  addresses: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
  cases: { select: { caseId: true } },
  _count: { select: { linksFrom: true, linksTo: true, logs: true } },
} as const;

/** GET /api/smart-police/investigation/suspects/[id] */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const row = await prisma.smartPoliceSuspect.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
    include: INCLUDE,
  });
  if (!row) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });
  return NextResponse.json({ suspect: mapSmartPoliceSuspect(row) });
}

/** PATCH /api/smart-police/investigation/suspects/[id] */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const existing = await prisma.smartPoliceSuspect.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const updated = await prisma.smartPoliceSuspect.update({
    where: { id },
    data: {
      ...(body.fullName !== undefined && text(body.fullName) ? { fullName: text(body.fullName)! } : {}),
      ...(body.alias !== undefined ? { alias: text(body.alias) } : {}),
      ...(body.nickname !== undefined ? { nickname: text(body.nickname) } : {}),
      ...(body.nationalId !== undefined ? { nationalId: text(body.nationalId) } : {}),
      ...(body.phone !== undefined ? { phone: text(body.phone) } : {}),
      ...(body.occupation !== undefined ? { occupation: text(body.occupation) } : {}),
      ...(body.photoUrl !== undefined ? { photoUrl: text(body.photoUrl) } : {}),
      ...(body.description !== undefined ? { description: text(body.description) } : {}),
      ...(body.notes !== undefined ? { notes: text(body.notes) } : {}),
      ...(typeof body.riskLevel === "string" ? { riskLevel: body.riskLevel } : {}),
      ...(typeof body.status === "string" ? { status: body.status } : {}),
    },
    include: INCLUDE,
  });

  return NextResponse.json({ suspect: mapSmartPoliceSuspect(updated) });
}

/** DELETE /api/smart-police/investigation/suspects/[id] */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const row = await prisma.smartPoliceSuspect.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
    select: { id: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });

  await prisma.smartPoliceSuspect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

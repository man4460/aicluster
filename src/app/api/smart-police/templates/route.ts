import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { ensureSmartPoliceBuiltinTemplates } from "@/lib/smart-police/api-owner";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

export async function GET() {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  await ensureSmartPoliceBuiltinTemplates(gate.ctx.ownerUserId);

  const rows = await prisma.smartPoliceTemplate.findMany({
    where: { ownerUserId: gate.ctx.ownerUserId },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({
    templates: rows.map((t) => ({
      id: t.id,
      kind: t.kind,
      name: t.name,
      content: t.content,
      isBuiltin: t.isBuiltin,
      isActive: t.isActive,
      sortOrder: t.sortOrder,
    })),
  });
}

export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);

  const body = (await req.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อแม่แบบ" }, { status: 400 });

  const kind = (typeof body.kind === "string" ? body.kind : "OTHER") as SmartPoliceDocumentKind;
  if (!["NARRATIVE", "STATEMENT", "WARRANT", "REPORT", "MEMO", "OTHER"].includes(kind)) {
    return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
  }

  const maxSort = await prisma.smartPoliceTemplate.aggregate({
    where: { ownerUserId: gate.ctx.ownerUserId, kind },
    _max: { sortOrder: true },
  });

  const t = await prisma.smartPoliceTemplate.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      kind,
      name,
      content,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isBuiltin: false,
    },
  });

  return NextResponse.json(
    {
      template: {
        id: t.id,
        kind: t.kind,
        name: t.name,
        content: t.content,
        isBuiltin: t.isBuiltin,
        isActive: t.isActive,
        sortOrder: t.sortOrder,
      },
    },
    { status: 201 },
  );
}

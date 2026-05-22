import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;

  const existing = await prisma.smartPoliceTemplate.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบแม่แบบ" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim() || existing.name;
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.kind === "string") {
    const kind = body.kind as SmartPoliceDocumentKind;
    if (["NARRATIVE", "STATEMENT", "WARRANT", "REPORT", "MEMO", "OTHER"].includes(kind)) {
      data.kind = kind;
    }
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.smartPoliceTemplate.update({ where: { id }, data });
  return NextResponse.json({
    template: {
      id: updated.id,
      kind: updated.kind,
      name: updated.name,
      content: updated.content,
      isBuiltin: updated.isBuiltin,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id } = await ctx.params;

  const existing = await prisma.smartPoliceTemplate.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบแม่แบบ" }, { status: 404 });
  if (existing.isBuiltin) {
    return NextResponse.json({ error: "ไม่สามารถลบแม่แบบระบบได้ — ปิดใช้งานแทน" }, { status: 400 });
  }
  await prisma.smartPoliceTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

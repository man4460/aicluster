import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { ensureSmartPoliceCasePresets } from "@/lib/smart-police/case-presets/ensure-builtin";
import { mapCasePreset } from "@/app/api/smart-police/case-presets/route";

/**
 * GET /api/smart-police/case-presets/[id]
 * รับได้ทั้ง id และ key (เช่น traffic) — คืน preset เดียวพร้อม starterFields/formSlugs
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  await ensureSmartPoliceCasePresets(gate.ctx.ownerUserId);

  const { id } = await params;
  const lookup = decodeURIComponent(id);

  const row = await prisma.smartPoliceCasePreset.findFirst({
    where: { ownerUserId: gate.ctx.ownerUserId, OR: [{ id: lookup }, { key: lookup }] },
  });
  if (!row) {
    return NextResponse.json({ error: "ไม่พบแม่แบบคดี" }, { status: 404 });
  }

  return NextResponse.json({ preset: mapCasePreset(row, gate.ctx.ownerUserId) });
}

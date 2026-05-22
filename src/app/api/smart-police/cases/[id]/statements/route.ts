import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { createStatementForParty, appOriginFromRequest } from "@/lib/smart-police/create-statement";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;

  const body = (await req.json()) as Record<string, unknown>;
  const partyId = typeof body.partyId === "string" ? body.partyId.trim() : "";
  if (!partyId) {
    return NextResponse.json({ error: "กรุณาเลือกบุคคล" }, { status: 400 });
  }

  try {
    const result = await createStatementForParty({
      ownerUserId: gate.ctx.ownerUserId,
      caseId,
      partyId,
      appOrigin: appOriginFromRequest(req),
      syncNarrative: body.syncNarrative !== false,
      generateWord: body.generateWord !== false,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "สร้างคำให้การไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

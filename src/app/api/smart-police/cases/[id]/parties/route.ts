import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import type { SmartPolicePartyRole } from "@/generated/prisma/enums";

async function assertCase(ownerUserId: string, caseId: string) {
  return prisma.smartPoliceCase.findFirst({ where: { id: caseId, ownerUserId } });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const { id: caseId } = await ctx.params;
  const c = await assertCase(gate.ctx.ownerUserId, caseId);
  if (!c) return NextResponse.json({ error: "ไม่พบคดี" }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) return NextResponse.json({ error: "กรุณาระบุชื่อ" }, { status: 400 });
  const role = (typeof body.role === "string" ? body.role : "OTHER") as SmartPolicePartyRole;
  if (!["COMPLAINANT", "SUSPECT", "WITNESS", "OFFICER", "OTHER"].includes(role)) {
    return NextResponse.json({ error: "บทบาทไม่ถูกต้อง" }, { status: 400 });
  }

  const maxSort = await prisma.smartPoliceParty.aggregate({
    where: { caseId },
    _max: { sortOrder: true },
  });

  const party = await prisma.smartPoliceParty.create({
    data: {
      caseId,
      role,
      fullName,
      age: typeof body.age === "number" ? Math.floor(body.age) : null,
      nationality: typeof body.nationality === "string" ? body.nationality.trim() || "ไทย" : "ไทย",
      idCard: typeof body.idCard === "string" ? body.idCard.trim() || null : null,
      address: typeof body.address === "string" ? body.address.trim() || null : null,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ party }, { status: 201 });
}

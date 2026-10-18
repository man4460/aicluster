import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";
import { mapSmartPoliceOfficer } from "@/lib/smart-police/serialize";

export async function GET() {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  const rows = await prisma.smartPoliceOfficer.findMany({
    where: { ownerUserId: gate.ctx.ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
  });
  return NextResponse.json({ officers: rows.map(mapSmartPoliceOfficer) });
}

export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const body = (await req.json()) as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) return NextResponse.json({ error: "กรุณาระบุชื่อ" }, { status: 400 });

  const maxSort = await prisma.smartPoliceOfficer.aggregate({
    where: { ownerUserId: gate.ctx.ownerUserId },
    _max: { sortOrder: true },
  });
  const isDefault = body.isDefault === true;

  if (isDefault) {
    await prisma.smartPoliceOfficer.updateMany({
      where: { ownerUserId: gate.ctx.ownerUserId },
      data: { isDefault: false },
    });
  }

  const row = await prisma.smartPoliceOfficer.create({
    data: {
      ownerUserId: gate.ctx.ownerUserId,
      fullName,
      rankTitle: typeof body.rankTitle === "string" ? body.rankTitle.trim() || null : null,
      position: typeof body.position === "string" ? body.position.trim() || null : null,
      birthDate:
        typeof body.birthDate === "string" && body.birthDate
          ? new Date(body.birthDate)
          : null,
      isDefault,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  if (isDefault) {
    await prisma.smartPoliceProfile.updateMany({
      where: { ownerUserId: gate.ctx.ownerUserId },
      data: {
        investigatorDefault: [row.rankTitle, row.fullName].filter(Boolean).join(" ").trim(),
      },
    });
  }

  return NextResponse.json({ officer: mapSmartPoliceOfficer(row) }, { status: 201 });
}

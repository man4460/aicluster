import { NextResponse } from "next/server";
import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { getOrCreateSmartPoliceProfile } from "@/lib/smart-police/api-owner";

export async function GET() {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const profile = await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
  const body = (await req.json()) as Record<string, unknown>;
  await getOrCreateSmartPoliceProfile(gate.ctx.ownerUserId);
  const str = (k: string) => (typeof body[k] === "string" ? String(body[k]).trim() : undefined);

  const data: Record<string, string | null> = {};
  if (body.stationName !== undefined) data.stationName = str("stationName") || "สถานีตำรวจ";
  if (body.stationAddress !== undefined) data.stationAddress = str("stationAddress") || null;
  if (body.province !== undefined) data.province = str("province") || null;
  if (body.commanderRank !== undefined) data.commanderRank = str("commanderRank") || null;
  if (body.commanderName !== undefined) data.commanderName = str("commanderName") || null;
  if (body.investigatorDefault !== undefined) data.investigatorDefault = str("investigatorDefault") || null;
  if (body.caseNumberPrefix !== undefined) data.caseNumberPrefix = str("caseNumberPrefix") || "ส.";
  if (body.printFooter !== undefined) data.printFooter = str("printFooter") || null;

  const updated = await prisma.smartPoliceProfile.update({
    where: { ownerUserId: gate.ctx.ownerUserId },
    data,
  });
  return NextResponse.json({
    profile: {
      id: updated.id,
      stationName: updated.stationName,
      stationAddress: updated.stationAddress,
      province: updated.province,
      commanderRank: updated.commanderRank,
      commanderName: updated.commanderName,
      investigatorDefault: updated.investigatorDefault,
      caseNumberPrefix: updated.caseNumberPrefix,
      printFooter: updated.printFooter,
    },
  });
}

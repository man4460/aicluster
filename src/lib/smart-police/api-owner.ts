import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { SMART_POLICE_BUILTIN_TEMPLATES } from "@/lib/smart-police/default-templates";
import type { SmartPoliceProfileDto } from "@/lib/smart-police/types";

export async function getSmartPoliceOwnerFromAuth(sessionSub: string) {
  const ctx = await getModuleBillingContext(sessionSub);
  if (!ctx) return null;
  return { ownerUserId: ctx.billingUserId, isStaff: ctx.isStaff, access: ctx.access };
}

export function mapSmartPoliceProfile(row: {
  id: string;
  stationName: string;
  stationAddress: string | null;
  province: string | null;
  commanderRank: string | null;
  commanderName: string | null;
  commanderTitle: string | null;
  headOfWorkRank: string | null;
  headOfWorkName: string | null;
  investigatorDefault: string | null;
  caseNumberPrefix: string;
  printFooter: string | null;
}): SmartPoliceProfileDto {
  return {
    id: row.id,
    stationName: row.stationName,
    stationAddress: row.stationAddress,
    province: row.province,
    commanderRank: row.commanderRank,
    commanderName: row.commanderName,
    commanderTitle: row.commanderTitle,
    headOfWorkRank: row.headOfWorkRank,
    headOfWorkName: row.headOfWorkName,
    investigatorDefault: row.investigatorDefault,
    caseNumberPrefix: row.caseNumberPrefix,
    printFooter: row.printFooter,
  };
}

export async function ensureSmartPoliceBuiltinTemplates(ownerUserId: string) {
  const count = await prisma.smartPoliceTemplate.count({
    where: { ownerUserId, isBuiltin: true },
  });
  if (count > 0) {
    // ensure new kinds exist for older installs
    for (const t of SMART_POLICE_BUILTIN_TEMPLATES) {
      const exists = await prisma.smartPoliceTemplate.findFirst({
        where: { ownerUserId, isBuiltin: true, name: t.name },
      });
      if (!exists) {
        await prisma.smartPoliceTemplate.create({
          data: {
            ownerUserId,
            kind: t.kind,
            name: t.name,
            content: t.content,
            sortOrder: t.sortOrder,
            isBuiltin: true,
            isActive: true,
          },
        });
      }
    }
    return;
  }
  await prisma.smartPoliceTemplate.createMany({
    data: SMART_POLICE_BUILTIN_TEMPLATES.map((t) => ({
      ownerUserId,
      kind: t.kind,
      name: t.name,
      content: t.content,
      sortOrder: t.sortOrder,
      isBuiltin: true,
      isActive: true,
    })),
  });
}

export async function getOrCreateSmartPoliceProfile(ownerUserId: string) {
  const existing = await prisma.smartPoliceProfile.findUnique({
    where: { ownerUserId },
  });
  if (existing) {
    await ensureSmartPoliceBuiltinTemplates(ownerUserId);
    return mapSmartPoliceProfile(existing);
  }
  const created = await prisma.smartPoliceProfile.create({
    data: {
      ownerUserId,
      stationName: "สถานีตำรวจ (ตั้งชื่อในตั้งค่า)",
      caseNumberPrefix: "ส.",
    },
  });
  await ensureSmartPoliceBuiltinTemplates(ownerUserId);
  return mapSmartPoliceProfile(created);
}

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

/** ลบแม่แบบระบบที่ชื่อซ้ำ — เก็บแถวเก่าสุดต่อชื่อ */
async function dedupeBuiltinTemplates(ownerUserId: string) {
  const rows = await prisma.smartPoliceTemplate.findMany({
    where: { ownerUserId, isBuiltin: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const row of rows) {
    const key = row.name.trim();
    if (seen.has(key)) duplicateIds.push(row.id);
    else seen.add(key);
  }
  if (duplicateIds.length > 0) {
    await prisma.smartPoliceTemplate.deleteMany({ where: { id: { in: duplicateIds } } });
  }
}

/**
 * เติมแม่แบบระบบที่ยังไม่มี (ตามชื่อ) — idempotent ไม่สร้างซ้ำ
 * และล้างตัวซ้ำจาก race เดิม
 */
export async function ensureSmartPoliceBuiltinTemplates(ownerUserId: string) {
  await dedupeBuiltinTemplates(ownerUserId);

  const existing = await prisma.smartPoliceTemplate.findMany({
    where: { ownerUserId, isBuiltin: true },
    select: { name: true },
  });
  const have = new Set(existing.map((r) => r.name.trim()));

  const missing = SMART_POLICE_BUILTIN_TEMPLATES.filter((t) => !have.has(t.name.trim()));
  if (missing.length === 0) return;

  await prisma.smartPoliceTemplate.createMany({
    data: missing.map((t) => ({
      ownerUserId,
      kind: t.kind,
      name: t.name,
      content: t.content,
      sortOrder: t.sortOrder,
      isBuiltin: true,
      isActive: true,
    })),
  });

  // กัน race สอง request พร้อมกัน: ล้างซ้ำอีกรอบหลัง create
  await dedupeBuiltinTemplates(ownerUserId);
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

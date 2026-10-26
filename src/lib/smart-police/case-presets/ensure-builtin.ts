/**
 * เติมแม่แบบตั้งต้นคดี (SmartPoliceCasePreset) ให้สถานี
 *
 * หลักเดียวกับคลังข้อหา: สร้างเฉพาะที่ยังไม่มีตาม `key` ไม่ทับค่าที่สถานีแก้เอง
 * — เรียกตอนเปิดโมดูล Smart Police (lazy) ไม่ต้องรัน seed มือ
 *
 * ที่มา: ฐานคดีเก่า 48 คดี → src/lib/smart-police/case-presets/catalog.ts
 */

import { prisma } from "@/lib/prisma";
import { SMART_POLICE_CASE_PRESETS } from "@/lib/smart-police/case-presets/catalog";

export async function ensureSmartPoliceCasePresets(ownerUserId: string): Promise<number> {
  const existing = await prisma.smartPoliceCasePreset.findMany({
    where: { ownerUserId },
    select: { key: true },
  });
  const have = new Set(existing.map((r) => r.key));
  const missing = SMART_POLICE_CASE_PRESETS.filter((p) => !have.has(p.key));
  if (missing.length === 0) return 0;

  // ผูกกับคลังข้อหาถ้ามีข้อความตรงกัน
  const charges = await prisma.smartPoliceCharge.findMany({
    where: { ownerUserId, isActive: true },
    select: { id: true, chargeText: true, lawRefs: true },
  });
  const chargeByText = new Map(charges.map((c) => [c.chargeText.trim(), c]));

  await prisma.smartPoliceCasePreset.createMany({
    data: missing.map((p) => ({
      ownerUserId,
      key: p.key,
      caseType: p.caseType,
      title: `${p.caseType} — ${p.chargeText.slice(0, 80)}`,
      chargeId: chargeByText.get(p.chargeText.trim())?.id ?? null,
      defaultChargeText: p.chargeText,
      defaultLawRefs: p.lawRefs,
      defaultCourtType: p.starterFields["case.courtType"] ?? null,
      defaultCustodyMode: p.defaultCustodyMode,
      starterFieldsJson: JSON.stringify(p.starterFields),
      formSlugs: JSON.stringify(p.formSlugs),
      isBuiltin: true,
      isActive: true,
      sortOrder: p.sortOrder,
    })),
  });

  return missing.length;
}

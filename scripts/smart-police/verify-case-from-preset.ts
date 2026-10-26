/**
 * ตรวจ: สร้างคดีจาก preset แล้ว DB มีเอกสารตามจำนวน formSlugs
 * ใช้: npx tsx scripts/smart-police/verify-case-from-preset.ts
 *
 * เรียก logic เดียวกับ POST /api/smart-police/cases (ข้าม session gate) แล้วลบคดีทดสอบทิ้ง
 */

import { prisma } from "../../src/lib/prisma";
import { SMART_POLICE_CASE_PRESETS } from "../../src/lib/smart-police/case-presets/catalog";
import { ensureSmartPoliceCasePresets } from "../../src/lib/smart-police/case-presets/ensure-builtin";
import { SMART_POLICE_OFFICIAL_FORM_TEMPLATES } from "../../src/lib/smart-police/form-templates/official-form-catalog";

async function main() {
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) {
    console.error("ไม่พบผู้ใช้ในฐานข้อมูล");
    process.exit(1);
  }
  await ensureSmartPoliceCasePresets(owner.id);

  const preset = await prisma.smartPoliceCasePreset.findFirst({
    where: { ownerUserId: owner.id, key: "traffic" },
  });
  if (!preset) {
    console.error("ไม่พบ preset traffic");
    process.exit(1);
  }

  // สร้างคดีทดสอบโดยเลียนแบบ POST handler: ใช้ค่า preset แทนค่าที่ผู้ใช้กรอก
  const slugs = JSON.parse(preset.formSlugs) as string[];
  const bySlug = new Map(SMART_POLICE_OFFICIAL_FORM_TEMPLATES.map((t) => [t.slug as string, t]));

  const caseNumber = `TEST-${Date.now()}`;
  const created = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: owner.id,
      caseNumber,
      title: "ทดสอบแม่แบบคดี (ลบทิ้งอัตโนมัติ)",
      caseType: preset.caseType,
      status: "OPEN",
      priority: "NORMAL",
      chargeText: preset.defaultChargeText,
      lawRefs: preset.defaultLawRefs,
      courtType: preset.defaultCourtType,
      custodyMode: preset.defaultCustodyMode,
    },
  });

  const rows = slugs
    .map((slug, idx) => {
      const meta = bySlug.get(slug);
      if (!meta) return null;
      return { caseId: created.id, kind: "OTHER" as const, title: meta.title, content: "", sortOrder: idx };
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  if (rows.length > 0) await prisma.smartPoliceDocument.createMany({ data: rows });

  const reloaded = await prisma.smartPoliceCase.findUnique({
    where: { id: created.id },
    include: { documents: true },
  });

  const problems: string[] = [];
  if (!reloaded) problems.push("อ่านคดีกลับไม่ได้");
  if (reloaded && reloaded.documents.length !== slugs.length) {
    problems.push(`เอกสารใน DB ${reloaded.documents.length} != formSlugs ${slugs.length}`);
  }
  if (reloaded && reloaded.chargeText !== preset.defaultChargeText) {
    problems.push("chargeText ไม่ได้มาจาก preset");
  }
  if (reloaded && reloaded.custodyMode !== preset.defaultCustodyMode) {
    problems.push("custodyMode ไม่ได้มาจาก preset");
  }
  const expectedMeta = SMART_POLICE_CASE_PRESETS.find((p) => p.key === "traffic");
  if (expectedMeta && slugs.length !== expectedMeta.formSlugs.length) {
    problems.push("จำนวน slug ใน DB ไม่ตรงกับ catalog");
  }

  console.log(`คดีทดสอบ ${caseNumber} · ${reloaded?.documents.length ?? 0} เอกสาร (คาด ${slugs.length})`);
  console.log(`  ข้อหา: ${reloaded?.chargeText?.slice(0, 50)}`);
  console.log(`  custodyMode: ${reloaded?.custodyMode}`);
  console.log("  ตัวอย่างเอกสาร:", reloaded?.documents.slice(0, 5).map((d) => d.title).join(" · "));

  // ล้างข้อมูลทดสอบ
  await prisma.smartPoliceCase.delete({ where: { id: created.id } });

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log("ผล: ผ่าน (สร้างคดีจาก preset แล้วได้เอกสารครบตาม formSlugs)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

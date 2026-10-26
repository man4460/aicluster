/**
 * ตรวจ flow ทั้งเส้นแบบ headless (ไม่ผ่าน UI ที่ต้อง login):
 *   preset → สร้างคดี → เอกสารตั้งต้น → เติมฟอร์ม → ลบ
 *
 * ใช้: npx tsx scripts/smart-police/verify-e2e-preset-flow.ts
 */

import { prisma } from "../../src/lib/prisma";
import { SMART_POLICE_CASE_PRESETS } from "../../src/lib/smart-police/case-presets/catalog";
import { ensureSmartPoliceCasePresets } from "../../src/lib/smart-police/case-presets/ensure-builtin";
import {
  applyCaseValues,
  buildCaseFieldValues,
  type FillSourceCase,
} from "../../src/lib/smart-police/case-presets/fill-form-from-case";
import { SMART_POLICE_OFFICIAL_FORM_TEMPLATES } from "../../src/lib/smart-police/form-templates/official-form-catalog";
import { createEmptySceneInspectFields } from "../../src/lib/smart-police/form-templates/scene-inspect";
import { createEmptyCaseCoverFields } from "../../src/lib/smart-police/form-templates/case-cover";
import { createEmptyDetentionRequestFields } from "../../src/lib/smart-police/form-templates/detention-request";

async function main() {
  const owner = (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!owner) throw new Error("ไม่พบผู้ใช้");
  await ensureSmartPoliceCasePresets(owner);
  const bySlug = new Map(SMART_POLICE_OFFICIAL_FORM_TEMPLATES.map((t) => [t.slug as string, t]));
  const problems: string[] = [];

  for (const preset of SMART_POLICE_CASE_PRESETS) {
    const caseNumber = `E2E-${preset.key}-${Date.now().toString().slice(-6)}`;
    const created = await prisma.smartPoliceCase.create({
      data: {
        ownerUserId: owner,
        caseNumber,
        title: `E2E ${preset.key}`,
        caseType: preset.caseType,
        status: "OPEN",
        priority: "NORMAL",
        chargeText: preset.chargeText,
        lawRefs: preset.lawRefs,
        courtType: preset.starterFields["case.courtType"] ?? null,
        custodyMode: preset.defaultCustodyMode,
        incidentAt: new Date("2024-05-01T02:00:00Z"),
        incidentPlace: "ที่เกิดเหตุทดสอบ",
        receivedAt: new Date("2024-05-01T03:00:00Z"),
        receivedTimeHm: "10.00",
        summary: "สรุปเหตุการณ์ทดสอบ",
        parties: {
          create: [
            { role: "COMPLAINANT", fullName: "นายทดสอบ ผู้กล่าวหา", caseRelation: "ผู้เสียหาย", sortOrder: 0 },
            { role: "SUSPECT", fullName: "นายทดสอบ ผู้ต้องหา", caseRelation: "ผู้ต้องสงสัย", sortOrder: 1 },
          ],
        },
      },
      include: { parties: true, evidence: true },
    });

    // เอกสารตั้งต้น (เหมือน POST /api/smart-police/cases)
    const docs = preset.formSlugs
      .map((slug, idx) => {
        const meta = bySlug.get(slug);
        return meta
          ? { caseId: created.id, kind: "OTHER" as const, title: meta.title, content: "", sortOrder: idx }
          : null;
      })
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    if (docs.length) await prisma.smartPoliceDocument.createMany({ data: docs });

    const withDocs = await prisma.smartPoliceCase.findUnique({
      where: { id: created.id },
      include: { documents: true },
    });
    if (withDocs!.documents.length !== preset.formSlugs.length) {
      problems.push(`${preset.key}: เอกสาร ${withDocs!.documents.length}/${preset.formSlugs.length}`);
    }

    // เติมฟอร์มจากคดี
    const source: FillSourceCase = {
      caseNumber: created.caseNumber,
      title: created.title,
      caseType: created.caseType,
      chargeText: created.chargeText,
      lawRefs: created.lawRefs,
      incidentAt: created.incidentAt?.toISOString() ?? null,
      incidentPlace: created.incidentPlace,
      receivedAt: created.receivedAt?.toISOString() ?? null,
      receivedTimeHm: created.receivedTimeHm,
      courtType: created.courtType,
      custodyMode: created.custodyMode,
      summary: created.summary,
      behaviorText: created.behaviorText,
      detainAt: null,
      parties: created.parties.map((p) => ({ role: p.role, fullName: p.fullName, caseRelation: p.caseRelation })),
      evidence: [],
    };
    const values = buildCaseFieldValues(source, {
      key: preset.key,
      caseType: preset.caseType,
      starterFields: preset.starterFields,
    });

    const forms = [
      { name: "scene-inspect", empty: createEmptySceneInspectFields() },
      { name: "case-cover", empty: createEmptyCaseCoverFields() },
      { name: "detention-request", empty: createEmptyDetentionRequestFields() },
    ];
    for (const form of forms) {
      const { filled } = applyCaseValues(form.empty as unknown as Record<string, unknown>, values);
      if (filled === 0) problems.push(`${preset.key}/${form.name}: เติมไม่ได้เลย`);
      else process.stdout.write(`  ${preset.key}/${form.name}: ${filled} ช่อง · `);
    }
    process.stdout.write("\n");

    await prisma.smartPoliceCase.delete({ where: { id: created.id } });
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log(`ผล: ผ่าน (${SMART_POLICE_CASE_PRESETS.length} preset · สร้างคดี+เอกสาร+เติมฟอร์มครบ)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

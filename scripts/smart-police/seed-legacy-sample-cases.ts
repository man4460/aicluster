/**
 * นำเข้าคดีตัวอย่างจากฐานคดีเก่า (ข้อมูลส่วนบุคคลเป็นชื่อสมมติ)
 *
 * ใช้: npx tsx scripts/smart-police/seed-legacy-sample-cases.ts [--owner <userId>]
 * ค่าเริ่มต้น: ผู้ใช้คนแรกในฐานข้อมูล
 *
 * idempotent: ถ้ามีคดีที่ caseNumber ซ้ำอยู่แล้วจะข้าม
 */

import { prisma } from "../../src/lib/prisma";
import { LEGACY_SAMPLE_CASES } from "../../src/lib/smart-police/case-presets/legacy-sample-cases";
import { ensureSmartPoliceCasePresets } from "../../src/lib/smart-police/case-presets/ensure-builtin";
import { SMART_POLICE_OFFICIAL_FORM_TEMPLATES } from "@/lib/smart-police/form-templates/official-form-catalog";

async function main() {
  const ownerArg = process.argv.indexOf("--owner");
  const ownerId =
    ownerArg > -1 ? process.argv[ownerArg + 1] : (await prisma.user.findFirst({ select: { id: true } }))?.id;
  if (!ownerId) {
    console.error("ไม่พบผู้ใช้ในฐานข้อมูล");
    process.exit(1);
  }

  await ensureSmartPoliceCasePresets(ownerId);
  const bySlug = new Map(SMART_POLICE_OFFICIAL_FORM_TEMPLATES.map((t) => [t.slug as string, t]));
  const log: string[] = [];

  for (const sample of LEGACY_SAMPLE_CASES) {
    const exists = await prisma.smartPoliceCase.findFirst({
      where: { ownerUserId: ownerId, caseNumber: sample.caseNumber },
      select: { id: true },
    });
    if (exists) {
      log.push(`ข้าม ${sample.caseNumber} (มีอยู่แล้ว)`);
      continue;
    }

    const preset = await prisma.smartPoliceCasePreset.findFirst({
      where: { ownerUserId: ownerId, key: sample.presetKey },
    });
    if (!preset) {
      log.push(`ข้าม ${sample.caseNumber} (ไม่พบ preset ${sample.presetKey})`);
      continue;
    }

    const slugs = JSON.parse(preset.formSlugs) as string[];
    const missingLegacy = sample.legacyDocKinds.filter((k) => !slugs.includes(k));

    const created = await prisma.smartPoliceCase.create({
      data: {
        ownerUserId: ownerId,
        caseNumber: sample.caseNumber,
        title: sample.title,
        caseType: sample.caseType,
        status: "OPEN",
        priority: "NORMAL",
        chargeText: sample.chargeText,
        lawRefs: sample.lawRefs,
        incidentAt: new Date(sample.incidentAt),
        incidentPlace: sample.incidentPlace,
        receivedAt: new Date(sample.receivedAt),
        receivedTimeHm: sample.receivedTimeHm,
        summary: sample.summary,
        behaviorText: sample.behaviorText,
        courtType: preset.defaultCourtType,
        custodyMode: preset.defaultCustodyMode,
        parties: {
          create: sample.parties.map((p, i) => ({
            role: p.role,
            fullName: p.fullName,
            caseRelation: p.caseRelation,
            sortOrder: i,
          })),
        },
        evidence: {
          create: sample.evidence.map((e, i) => ({
            name: e.name,
            quantityLabel: e.quantityLabel,
            seizureNo: e.seizureNo,
            sortOrder: i,
          })),
        },
      },
    });

    const docs = slugs
      .map((slug, idx) => {
        const meta = bySlug.get(slug);
        if (!meta) return null;
        return {
          caseId: created.id,
          kind: "OTHER" as const,
          title: meta.title,
          content: "",
          sortOrder: idx,
        };
      })
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    if (docs.length > 0) await prisma.smartPoliceDocument.createMany({ data: docs });

    log.push(
      `สร้าง ${sample.caseNumber} (${sample.caseType}) · ${docs.length} เอกสาร` +
        (missingLegacy.length ? ` · คดีจริงมีเอกสารที่ preset ไม่มี: ${missingLegacy.join(", ")}` : ""),
    );
  }

  console.log(log.join("\n"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

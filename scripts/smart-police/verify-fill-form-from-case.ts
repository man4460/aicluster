/**
 * ตรวจ "ดึงข้อมูลตั้งต้นจากคดี" — สร้างคดีจาก preset แล้วเติมฟอร์มจริง
 * ใช้: npx tsx scripts/smart-police/verify-fill-form-from-case.ts
 */

import { prisma } from "../../src/lib/prisma";
import { ensureSmartPoliceCasePresets } from "../../src/lib/smart-police/case-presets/ensure-builtin";
import {
  applyCaseValues,
  buildCaseFieldValues,
  thaiDateSlash,
  type FillSourceCase,
} from "../../src/lib/smart-police/case-presets/fill-form-from-case";
import { createEmptySceneInspectFields } from "../../src/lib/smart-police/form-templates/scene-inspect";
import { createEmptyCaseCoverFields } from "../../src/lib/smart-police/form-templates/case-cover";

async function main() {
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) {
    console.error("ไม่พบผู้ใช้");
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

  const caseNumber = `FILL-${Date.now()}`;
  const created = await prisma.smartPoliceCase.create({
    data: {
      ownerUserId: owner.id,
      caseNumber,
      title: "ทดสอบดึงข้อมูลเขาฟอร์ม",
      caseType: preset.caseType,
      status: "OPEN",
      priority: "NORMAL",
      chargeText: preset.defaultChargeText,
      lawRefs: preset.defaultLawRefs,
      courtType: preset.defaultCourtType,
      custodyMode: preset.defaultCustodyMode,
      incidentAt: new Date("2024-03-05T03:30:00Z"),
      incidentPlace: "ถนนสุขุมวิท กม.12 ต.บางละมุง",
      receivedAt: new Date("2024-03-05T04:00:00Z"),
      receivedTimeHm: "11:00",
      summary: "รถกระบะเฉี่ยวชนรถจักรยานยนต์ มีผู้บาดเจ็บเล็กน้อย",
      parties: {
        create: [
          { role: "COMPLAINANT", fullName: "นายทดสอบ ผู้กล่าวหา", caseRelation: "ผู้เสียหาย", sortOrder: 0 },
          { role: "SUSPECT", fullName: "นายทดสอบ ผู้ต้องหา", caseRelation: "ผู้ขับขี่", sortOrder: 1 },
          { role: "WITNESS", fullName: "นายทดสอบ พยาน", caseRelation: "ผู้เห็นเหตุการณ์", sortOrder: 2 },
        ],
      },
      evidence: {
        create: [{ name: "รถจักรยานยนต์ สีดำ", quantityLabel: "1 คัน", seizureNo: "ย.1/2567", sortOrder: 0 }],
      },
    },
    include: { parties: true, evidence: true },
  });

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
    parties: created.parties.map((p) => ({
      role: p.role,
      fullName: p.fullName,
      caseRelation: p.caseRelation,
    })),
    evidence: created.evidence.map((e) => ({
      name: e.name,
      quantityLabel: e.quantityLabel,
      seizureNo: e.seizureNo,
    })),
  };

  const values = buildCaseFieldValues(source, {
    key: preset.key,
    caseType: preset.caseType,
    starterFields: JSON.parse(preset.starterFieldsJson) as Record<string, string>,
  });

  // ฟอร์มที่ต้องตรวจ (ตาม acceptance ของขั้นนี้)
  const sceneEmpty = createEmptySceneInspectFields();
  const scene = applyCaseValues(sceneEmpty as unknown as Record<string, unknown>, values);
  const coverEmpty = createEmptyCaseCoverFields();
  const cover = applyCaseValues(coverEmpty as unknown as Record<string, unknown>, values);

  const sceneKeys = Object.keys(sceneEmpty) as Array<keyof typeof sceneEmpty>;
  console.log(`ฟอร์มบันทึกตรวจสถานที่เกิดเหตุ: เติม ${scene.filled} ช่อง`);
  for (const k of sceneKeys) {
    const v = (scene.next as Record<string, string>)[k];
    if (v) console.log(`  ${k} = ${String(v).slice(0, 70)}`);
  }

  const problems: string[] = [];
  const sceneNext = scene.next as Record<string, string>;
  const joined = Object.values(sceneNext).join(" | ");
  if (!joined.includes("นายทดสอบ ผู้กล่าวหา")) problems.push("ไม่มีชื่อผู้กล่าวหาในฟอร์มตรวจที่เกิดเหตุ");
  if (!joined.includes("นายทดสอบ ผู้ต้องหา")) problems.push("ไม่มีชื่อผู้ต้องหา");
  if (!joined.includes("ขับรถโดยประมาท")) problems.push("ไม่มีข้อหา");
  if (!joined.includes("สุขุมวิท")) problems.push("ไม่มีสถานที่เกิดเหตุ");
  if (!thaiDateSlash(source.incidentAt).match(/\d{2}\/\d{2}\/25\d{2}/)) problems.push("วันที่ไทยผิดรูป");

  // ปกสำนวน (ฟอร์มที่มีฟิลด์ charge/victim/suspect)
  const coverNext = cover.next as Record<string, string>;
  if (!coverNext.suspect?.includes("ผู้ต้องหา")) problems.push("ปกสำนวน: ไม่มีชื่อผู้ต้องหา");
  if (!coverNext.charge?.includes("ขับรถโดยประมาท")) problems.push("ปกสำนวน: ไม่มีข้อหา");

  // ตรวจว่าไม่ทับค่าที่พิมพ์ไว้
  const filledTwice = applyCaseValues(sceneNext, values, { overwrite: false });
  if (filledTwice.filled !== 0) problems.push("กรอกซ้ำแล้วทับค่าที่มีอยู่");
  const overwritten = applyCaseValues({ ...sceneNext, incidentPlace: "พิมพ์เอง" }, values, { overwrite: true });
  if ((overwritten.next as Record<string, string>).incidentPlace !== source.incidentPlace) {
    problems.push("โหมด overwrite ไม่ทำงาน");
  }

  await prisma.smartPoliceCase.delete({ where: { id: created.id } });

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log(`ปกสำนวน: charge="${coverNext.charge.slice(0, 40)}…" suspect="${coverNext.suspect}"`);
  console.log("ผล: ผ่าน (ชื่อคู่ความ/ข้อหา/วันเวลา/สถานที่ ขึ้นครบทุกฟอร์มที่ทดสอบ)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

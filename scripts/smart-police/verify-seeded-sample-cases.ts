/**
 * ตรวจคดีตัวอย่างที่ seed แล้ว: อ่านกลับได้ + ข้อมูลครบ + เอกสารตามจำนวน
 * ใช้: npx tsx scripts/smart-police/verify-seeded-sample-cases.ts
 */

import { prisma } from "../../src/lib/prisma";
import { LEGACY_SAMPLE_CASES } from "../../src/lib/smart-police/case-presets/legacy-sample-cases";

async function main() {
  const problems: string[] = [];
  for (const sample of LEGACY_SAMPLE_CASES) {
    const row = await prisma.smartPoliceCase.findFirst({
      where: { caseNumber: sample.caseNumber },
      include: { parties: true, evidence: true, documents: true },
    });
    if (!row) {
      problems.push(`${sample.caseNumber}: ไม่พบคดี`);
      continue;
    }
    const complainant = row.parties.filter((p) => p.role === "COMPLAINANT").length;
    const suspects = row.parties.filter((p) => p.role === "SUSPECT").length;
    const witnesses = row.parties.filter((p) => p.role === "WITNESS").length;

    console.log(
      `${row.caseNumber} · ${row.caseType} · ${row.documents.length} เอกสาร · ` +
        `ผู้กล่าวหา ${complainant} / ผู้ต้องหา ${suspects} / พยาน ${witnesses} · ` +
        `ของกลาง ${row.evidence.length}`,
    );
    console.log(`  ข้อหา: ${row.chargeText?.slice(0, 60)}…`);
    console.log(`  สถานที่: ${row.incidentPlace}`);
    console.log(`  เอกสาร: ${row.documents.slice(0, 4).map((d) => d.title).join(" · ")}…`);

    if (!row.chargeText?.trim()) problems.push(`${sample.caseNumber}: ไม่มีข้อหา`);
    if (!row.lawRefs?.trim()) problems.push(`${sample.caseNumber}: ไม่มีกฎหมาย`);
    if (!row.incidentPlace?.trim()) problems.push(`${sample.caseNumber}: ไม่มีสถานที่เกิดเหตุ`);
    if (!row.summary?.trim()) problems.push(`${sample.caseNumber}: ไม่มีพฤติการณ์`);
    if (complainant < 1) problems.push(`${sample.caseNumber}: ไม่มีผู้กล่าวหา`);
    if (suspects < 1) problems.push(`${sample.caseNumber}: ไม่มีผู้ต้องหา`);
    if (row.documents.length < 10) problems.push(`${sample.caseNumber}: เอกสารน้อยเกินไป`);

    // ข้อมูลส่วนบุคคลต้องเป็นชื่อสมมติ ไม่ใช่ชื่อจากฐานคดีเก่า
    const legacyNames = ["เร๊าะมัน", "ธีรรัฐ", "จงรักษ์", "เชษณรงค์", "วรวิช", "ธรรมรัตน์"];
    const allNames = row.parties.map((p) => p.fullName).join(" ") + " " + (row.chargeText ?? "");
    const leaked = legacyNames.filter((n) => allNames.includes(n));
    if (leaked.length) problems.push(`${sample.caseNumber}: พบชื่อจริงในคดีเก่า (${leaked.join(", ")})`);
  }

  if (problems.length) {
    console.error("ปัญหา:\n  - " + problems.join("\n  - "));
    console.log("ผล: ไม่ผ่าน");
    process.exit(1);
  }
  console.log(`ผล: ผ่าน (เปิดคดีได้ทั้ง ${LEGACY_SAMPLE_CASES.length} คดี · ข้อมูลครบ · ไม่มีชื่อบุคคลจริง)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

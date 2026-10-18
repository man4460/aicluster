import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

export type BuiltinTemplateSeed = {
  kind: SmartPoliceDocumentKind;
  name: string;
  content: string;
  sortOrder: number;
};

/** แม่แบบเริ่มต้น — อิงฟังก์ชันหลัก SmartPolice (สำนวน / คำให้การ / หมาย / บันทึก) */
export const SMART_POLICE_BUILTIN_TEMPLATES: BuiltinTemplateSeed[] = [
  {
    kind: "NARRATIVE",
    name: "สำนวนคดี (ตัวอย่าง)",
    sortOrder: 1,
    content: `สำนวนคดี

เลขที่คดี {{caseNumber}}
เรื่อง {{caseTitle}}

{{stationName}}
วันที่ {{todayThai}}

ข้าพเจ้า {{investigator}} พนักงานสอบสวน สถานีตำรวจ{{stationName}}
ได้รับแจ้งเหตุเมื่อ {{incidentAt}} ณ {{incidentPlace}}

{{summary}}

รายละเอียดคดี
…………………………………………………………………………………………………………

บุคคลที่เกี่ยวข้อง
{{partiesList}}

ลงชื่อผู้จัดทำ ………………………………
({{investigator}})
พนักงานสอบสวน`,
  },
  {
    kind: "STATEMENT",
    name: "คำให้การตามแบบ (ราชการ)",
    sortOrder: 2,
    content: `คำให้การผู้กล่าวหา

{{stationName}}
เลขที่คดี {{caseNumber}}
เรื่อง {{caseTitle}}

ข้าพเจ้า {{partyName}} อายุ {{partyAge}} ปี สัญชาติ {{partyNationality}}
เลขประจำตัวประชาชน {{partyIdCard}}
อยู่บ้านเลขที่ {{partyAddress}}

ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. …………………………………………………………………………………………………………

ข้อ 2. …………………………………………………………………………………………………………

ข้อ 3. …………………………………………………………………………………………………………

ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ

ลงชื่อผู้ให้การ ………………………………………
({{partyName}})

ลงชื่อพนักงานสอบสวน ………………………………………
({{investigator}})

วันที่ {{todayThai}}`,
  },
  {
    kind: "WARRANT",
    name: "หมายเรียกพยาน",
    sortOrder: 3,
    content: `หมายเรียกพยาน

เลขที่คดี {{caseNumber}}

เรียน {{partyName}}
ที่อยู่ {{partyAddress}}

ให้มาพบพนักงานสอบสวน ณ {{stationName}}
วันที่ …………………… เวลา …………………… น.

หมายเหตุ หากไม่มาตามหมายอาจมีโทษตามกฎหมาย

{{stationName}}
วันที่ {{todayThai}}`,
  },
  {
    kind: "MEMO",
    name: "บันทึกพนักงานสอบสวน",
    sortOrder: 4,
    content: `บันทึกพนักงานสอบสวน

เลขที่คดี {{caseNumber}}

วันเวลา {{todayThai}}
สถานที่ {{stationName}}

เรื่อง ………………………………………………………………………………………………

…………………………………………………………………………………………………………

ลงชื่อ ………………………………
({{investigator}})
พนักงานสอบสวน`,
  },
  {
    kind: "REPORT",
    name: "รายงานสรุปคดี",
    sortOrder: 5,
    content: `รายงานสรุปคดี

เลขที่คดี {{caseNumber}} — {{caseTitle}}
ประเภทคดี {{caseType}}
สถานะ {{caseStatus}}
ข้อหา {{chargeText}}

สรุปเหตุการณ์
{{behaviorText}}
{{summary}}

จำนวนเอกสารในคดี {{documentCount}} ฉบับ
จำนวนบุคคลที่เกี่ยวข้อง {{partyCount}} ราย
จำนวนของกลาง {{evidenceCount}} รายการ

{{stationName}}
วันที่ {{todayThai}}`,
  },
  {
    kind: "PROPERTY_LIST",
    name: "บัญชีของกลาง",
    sortOrder: 6,
    content: `บัญชีของกลาง / รายการทรัพย์

เลขที่คดี {{caseNumber}}
เรื่อง {{caseTitle}}
{{stationName}}
วันที่ {{todayThai}}

{{evidenceList}}

ลงชื่อผู้จัดทำ ………………………………
({{investigator}})`,
  },
  {
    kind: "INVESTIGATION_REPORT",
    name: "รายงานการสอบสวน",
    sortOrder: 7,
    content: `รายงานการสอบสวน

เลขที่คดี {{caseNumber}} — {{caseTitle}}
ประเภทคดี {{caseType}}
ข้อหา {{chargeText}}
กฎหมายที่อ้าง {{lawRefs}}
ผลชั้นสอบสวน {{investigationResult}}

พฤติการณ์
{{behaviorText}}

บุคคลที่เกี่ยวข้อง
{{partiesList}}

ของกลาง
{{evidenceList}}

{{stationName}}
วันที่ {{todayThai}}
({{investigator}})`,
  },
];

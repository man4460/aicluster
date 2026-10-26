/**
 * คดีตัวอย่างจากฐานคดีเก่า — ใช้สำหรับทดสอบ/สาธิตการทำคดีแต่ละประเภท
 *
 * ที่มา: D:\Data\14-พฤศจิกายน-2555 (สคริปต์ scripts/legacy/extract-legacy-cases.py)
 * ⚠️ ข้อมูลส่วนบุคคลถูกแทนที่ด้วยชื่อสมมติทั้งหมด — ไม่ใช่ข้อมูลจริงของบุคคล
 *    คงไว้เฉพาะโครงสร้างคดี: เลขคดี · ประเภท · ข้อหา · กฎหมาย · ชุดเอกสาร · ลำดับเหตุการณ์
 */

export type LegacySampleParty = {
  role: "COMPLAINANT" | "SUSPECT" | "WITNESS";
  fullName: string;
  caseRelation: string | null;
};

export type LegacySampleCase = {
  /** stamp ในฐานคดีเก่า ใช้อ้างอิงกลับไปที่ tmp/legacy/cases.json */
  stamp: string;
  /** preset ที่ใช้สร้างคดี */
  presetKey: "traffic" | "narcotics";
  caseNumber: string;
  title: string;
  caseType: string;
  chargeText: string;
  lawRefs: string;
  incidentAt: string;
  incidentPlace: string;
  receivedAt: string;
  receivedTimeHm: string;
  summary: string;
  behaviorText: string;
  parties: LegacySampleParty[];
  evidence: Array<{ name: string; quantityLabel: string | null; seizureNo: string | null }>;
  /** เอกสารที่มีในคดีจริง (slug) — ใช้ตรวจว่า preset ครอบคลุมของจริง */
  legacyDocKinds: string[];
};

export const LEGACY_SAMPLE_CASES: LegacySampleCase[] = [
  {
    stamp: "จ 18!2554",
    presetKey: "traffic",
    caseNumber: "18/2554",
    title: "คดีจราจร 18/2554 · รถกระบะเฉี่ยวชนแล้วกระแทกรถที่จอดอยู่",
    caseType: "คดีจราจร",
    chargeText: "ขับรถโดยประมาท เป็นเหตุให้ทรัพย์สินของผู้อื่นได้รับความเสียหาย",
    lawRefs:
      "พระราชบัญญัติจราจรทางบก พ.ศ. 2522 มาตรา 43, 52, 53, 157 · พระราชบัญญัติจราจรทางบก (ฉบับที่ 4) พ.ศ. 2535 มาตรา 27",
    incidentAt: "2011-07-04T10:30:00+07:00",
    incidentPlace: "ถนนเพชรเกษม ทางแยกเข้าสนามบินหาดใหญ่ อ.หาดใหญ่ จ.สงขลา",
    receivedAt: "2011-07-04T11:00:00+07:00",
    receivedTimeHm: "11.00",
    summary:
      "รถยนต์กระบะหมายเลขทะเบียน (สมมติ) ขับมาตามทางตรง เมื่อถึงทางกลับรถได้เฉี่ยวชนรถยนต์ที่กลับรถอยู่ แล้วไปกระแทกรถยนต์อีกคันที่จอดอยู่ข้างทาง มีทรัพย์สินเสียหาย 3 คัน",
    behaviorText:
      "ผู้ขับขี่ไม่ได้ลดความเร็วและไม่ให้ไฟสัญญาณก่อนกลับรถ จึงขับรถโดยประมาท",
    parties: [
      { role: "COMPLAINANT", fullName: "นายสมชาย ใจดี", caseRelation: "ผู้เสียหาย" },
      { role: "SUSPECT", fullName: "นายธีระ ทองแท้", caseRelation: "ผู้ขับขี่" },
      { role: "WITNESS", fullName: "นาย常住 ใจชื่น", caseRelation: "ผู้เห็นเหตุการณ์" },
    ],
    evidence: [
      { name: "รถยนต์กระบะ (ของกลางเพื่อตรวจสภาพ)", quantityLabel: "1 คัน", seizureNo: "ย.1/2554" },
    ],
    legacyDocKinds: [
      "case-cover",
      "case-photo",
      "charge-notice",
      "forensic-request",
      "inquiry-docket",
      "inquiry-memo",
      "inquiry-report",
      "scene-inspect",
      "statement-complainant",
      "statement-suspect",
      "suspect-summons",
    ],
  },
  {
    stamp: "อ 1132!2554",
    presetKey: "narcotics",
    caseNumber: "1132/2554",
    title: "คดียาเสพติด 1132/2554 · ครอบครองและเสพยาบ้า ๒ คน",
    caseType: "คดียาเสพติด",
    chargeText:
      "มียาเสพติดให้โทษประเภท 1 (เมทแอมเฟตามีน) ไว้ในครอบครองโดยฝ่าฝืนต่อกฎหมาย และเสพยาเสพติดให้โทษประเภท 1 (เมทแอมเฟตามีน) โดยฝ่าฝืนต่อกฎหมาย",
    lawRefs:
      "พระราชบัญญัติยาเสพติดให้โทษ พ.ศ. 2522 มาตรา 4, 7, 8, 15, 57, 67, 91 · ประมวลกฎหมายอาญา มาตรา 83",
    incidentAt: "2011-06-18T21:40:00+07:00",
    incidentPlace: "บริเวณปากซอยหลังสถานีตำรวจ อ.หาดใหญ่ จ.สงขลา",
    receivedAt: "2011-06-18T22:10:00+07:00",
    receivedTimeHm: "22.10",
    summary:
      "เจ้าพนักงานจับกุมผู้ต้องหา 2 คนพร้อมของกลางยาบ้าจำนวนหนึ่ง ขณะตรวจค้นพบของกลางในกระเป๋ากางเกง ต่อมาผลตรวจปัสสาวะเป็นบวก จึงแจ้งข้อหาครอบครองและเสพ",
    behaviorText:
      "ผู้ต้องหาให้การรับสารภาพว่าเสพยาบ้า และรับว่าของกลางเป็นของผู้ต้องหาทั้งสอง",
    parties: [
      { role: "COMPLAINANT", fullName: "ร.ต.อ.ประเสริฐ มั่นคง", caseRelation: "เจ้าพนักงานผู้จับกุม" },
      { role: "SUSPECT", fullName: "นายณัฐพงษ์ ศรีสุวรรณ", caseRelation: "ผู้ต้องหาที่ 1" },
      { role: "SUSPECT", fullName: "นายกิตติศักดิ์ วงศ์ทอง", caseRelation: "ผู้ต้องหาที่ 2" },
      { role: "WITNESS", fullName: "จ.ส.ต.ชัยวัฒน์ สาระวงศ์", caseRelation: "พยานผู้ร่วมจับกุม" },
    ],
    evidence: [
      { name: "ยาบ้า (เมทแอมเฟตามีน) ชนิดเม็ด", quantityLabel: "10 เม็ด", seizureNo: "ย.2/2554" },
      { name: "ผลตรวจปัสสาวะผู้ต้องหาทั้งสอง", quantityLabel: "2 ฉบับ", seizureNo: null },
    ],
    legacyDocKinds: [
      "case-cover",
      "custody-log",
      "forensic-request",
      "inquiry-docket",
      "inquiry-memo",
      "inquiry-report",
      "statement-complainant",
      "statement-suspect",
      "statement-witness",
    ],
  },
];

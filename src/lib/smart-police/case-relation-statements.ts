import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import { SMART_POLICE_PARTY_ROLE_LABEL } from "@/lib/smart-police/types";

export type RelationStatementCtx = {
  caseNumber: string;
  caseTitle: string;
  chargeText: string;
  stationName: string;
  investigator: string;
  todayThai: string;
  behaviorText: string;
  partyName: string;
  partyAge: string;
  partyNationality: string;
  partyIdCard: string;
  partyAddress: string;
  partyPhone: string;
  role: SmartPolicePartyRole;
  caseRelation: string | null;
  pleaStatus: string | null;
  occupation: string | null;
  workplace: string | null;
  evidenceSummary: string;
};

function header(ctx: RelationStatementCtx, title: string): string {
  return `${title}

${ctx.stationName}
เลขที่คดี ${ctx.caseNumber}
เรื่อง ${ctx.caseTitle}
${ctx.chargeText ? `ข้อหา ${ctx.chargeText}` : ""}

ข้าพเจ้า ${ctx.partyName} อายุ ${ctx.partyAge || "…………"} ปี สัญชาติ ${ctx.partyNationality || "…………"}
เลขประจำตัวประชาชน ${ctx.partyIdCard || "………………………………"}
อยู่บ้านเลขที่ ${ctx.partyAddress || "…………………………………………………………………………"}
${ctx.partyPhone ? `โทรศัพท์ ${ctx.partyPhone}` : ""}
${ctx.occupation ? `อาชีพ ${ctx.occupation}` : ""}
${ctx.workplace ? `ที่ทำงาน/ตำแหน่ง ${ctx.workplace}` : ""}
ในฐานะ${SMART_POLICE_PARTY_ROLE_LABEL[ctx.role]}${ctx.caseRelation ? ` (${ctx.caseRelation})` : ""}
`;
}

function footer(ctx: RelationStatementCtx): string {
  return `
ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ

ลงชื่อผู้ให้การ ………………………………………
(${ctx.partyName})

ลงชื่อพนักงานสอบสวน ………………………………………
(${ctx.investigator || "……………………………………"})

วันที่ ${ctx.todayThai}`;
}

/** สร้างเนื้อหาคำให้การตาม «เกี่ยวกับคดี» — เคสตัวอย่างยาบ้าจุดตรวจ */
export function buildStatementByCaseRelation(ctx: RelationStatementCtx): string {
  const rel = (ctx.caseRelation ?? "").trim();
  const roleLabel = SMART_POLICE_PARTY_ROLE_LABEL[ctx.role];
  const title =
    ctx.role === "COMPLAINANT"
      ? "คำให้การผู้กล่าวหา"
      : ctx.role === "SUSPECT"
        ? "คำให้การผู้ต้องหา"
        : ctx.role === "WITNESS"
          ? "คำให้การพยาน"
          : `คำให้การ (${roleLabel})`;

  let body = "";

  if (rel.includes("ผู้จับกุม") && !rel.includes("ร่วม")) {
    body = `ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. ข้าพเจ้าเป็นเจ้าหน้าที่ตำรวจ ได้ตั้งจุดตรวจ ณ ที่เกิดเหตุตามที่ระบุในสำนวน

ข้อ 2. พบผู้ต้องหาขับขี่รถจักรยานยนต์ผ่านมา จึงเรียกตรวจ และพบของกลางตามรายการของกลางในคดีนี้
${ctx.evidenceSummary ? `\nรายการของกลางที่เกี่ยวข้อง\n${ctx.evidenceSummary}` : ""}

ข้อ 3. จึงได้ยึดของกลางและนำตัวผู้ต้องหาส่งพนักงานสอบสวนเพื่อดำเนินคดีในข้อหาดังกล่าว

ข้อ 4. ${ctx.behaviorText || "…………………………………………………………………………………………………………"}`;
  } else if (rel.includes("ร่วมจับกุม") || rel.includes("ผู้ร่วมจับกุม")) {
    body = `ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. ข้าพเจ้าเป็นเจ้าหน้าที่ตำรวจ ได้ร่วมกับผู้กล่าวหาตั้งจุดตรวจและจับกุมผู้ต้องหา

ข้อ 2. ข้าพเจ้าได้เห็นการตรวจค้นและยึดของกลางตามที่ผู้กล่าวหาให้การไว้ และรับรองว่าเป็นความจริง

ข้อ 3. ${ctx.behaviorText || "…………………………………………………………………………………………………………"}`;
  } else if (rel.includes("ผู้ถือกรรมสิทธิ์")) {
    body = `ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. ข้าพเจ้าเป็นผู้ถือกรรมสิทธิ์ในทรัพย์ของกลางตามรายการในคดีนี้
${ctx.evidenceSummary ? `\n${ctx.evidenceSummary}` : ""}

ข้อ 2. ทรัพย์ดังกล่าวผู้ต้องหายืมไปใช้ / ไปอยู่กับผู้ต้องหาด้วยเหตุ ${"…………………………………………"}

ข้อ 3. ข้าพเจ้าขอรับทรัพย์ของกลางคืน และพร้อมให้การเพิ่มเติมตามที่พนักงานสอบสวนสอบถาม`;
  } else if (rel.includes("ผู้รับมอบอำนาจ")) {
    body = `ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. ข้าพเจ้าได้รับมอบอำนาจจากผู้ถือกรรมสิทธิ์ในทรัพย์ของกลาง ให้มาติดต่อขอรับของกลางคืน

ข้อ 2. ข้าพเจ้าขอรับทรัพย์ของกลางแทนผู้มอบอำนาจ และยืนยันเอกสารมอบอำนาจตามที่ได้แนบไว้`;
  } else if (ctx.role === "SUSPECT") {
    const plea = ctx.pleaStatus || "…………………………………………";
    body = `ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. ข้าพเจ้าทราบข้อหาที่ถูกกล่าวหาแล้ว

ข้อ 2. ข้าพเจ้าให้การว่า ${plea}

ข้อ 3. ${ctx.behaviorText || "…………………………………………………………………………………………………………"}

ข้อ 4. รายการของกลาง
${ctx.evidenceSummary || "…………………………………………………………………………………………………………"}`;
  } else {
    body = `ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. ข้าพเจ้าเกี่ยวข้องกับคดีในฐานะ ${rel || roleLabel}

ข้อ 2. ${ctx.behaviorText || "…………………………………………………………………………………………………………"}

ข้อ 3. …………………………………………………………………………………………………………`;
  }

  return `${header(ctx, title)}\n${body}${footer(ctx)}`;
}

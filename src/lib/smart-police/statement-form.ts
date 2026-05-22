import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import { SMART_POLICE_PARTY_ROLE_LABEL } from "@/lib/smart-police/types";

export type StatementFormParty = {
  fullName: string;
  role: SmartPolicePartyRole;
  age: number | null;
  nationality: string | null;
  idCard: string | null;
  address: string | null;
  phone: string | null;
};

export type StatementFormContext = {
  caseNumber: string;
  caseTitle: string;
  stationName: string;
  investigator: string;
  todayThai: string;
  party: StatementFormParty;
};

/** หัวข้อคำให้การตามบทบาท (แบบราชการ) */
export function statementTitleForRole(role: SmartPolicePartyRole): string {
  if (role === "COMPLAINANT") return "คำให้การผู้กล่าวหา";
  if (role === "SUSPECT") return "คำให้การผู้ต้องหา";
  if (role === "WITNESS") return "คำให้การพยาน";
  return `คำให้การ (${SMART_POLICE_PARTY_ROLE_LABEL[role]})`;
}

/**
 * แบบฟอร์มคำให้การตามแบบ — ใช้ในระบบ / ส่งออก Word
 * ช่องว่าง ………… ให้กรอกต่อใน Microsoft Word
 */
export function buildOfficialStatementFormText(ctx: StatementFormContext): string {
  const p = ctx.party;
  const roleLabel = SMART_POLICE_PARTY_ROLE_LABEL[p.role];
  return `${statementTitleForRole(p.role)}

${ctx.stationName}
เลขที่คดี ${ctx.caseNumber}
เรื่อง ${ctx.caseTitle}

ข้าพเจ้า ${p.fullName} อายุ ${p.age != null ? String(p.age) : "…………"} ปี สัญชาติ ${p.nationality ?? "…………"}
${p.idCard ? `เลขประจำตัวประชาชน ${p.idCard}` : "เลขประจำตัวประชาชน ………………………………"}
อยู่บ้านเลขที่ ${p.address ?? "…………………………………………………………………………"}
${p.phone ? `โทรศัพท์ ${p.phone}` : ""}
ในฐานะ${roleLabel}

ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า

ข้อ 1. …………………………………………………………………………………………………………

ข้อ 2. …………………………………………………………………………………………………………

ข้อ 3. …………………………………………………………………………………………………………

ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ

ลงชื่อผู้ให้การ ………………………………………
(${p.fullName})

ลงชื่อพนักงานสอบสวน ………………………………………
(${ctx.investigator || "……………………………………"})

วันที่ ${ctx.todayThai}`;
}

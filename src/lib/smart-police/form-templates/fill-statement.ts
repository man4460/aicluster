import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import { statementTemplateSlugForRole } from "@/lib/smart-police/form-templates/statement-catalog";
import type {
  StatementDocumentContent,
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
} from "@/lib/smart-police/form-templates/statement-types";
import { STATEMENT_CONTENT_MARKER } from "@/lib/smart-police/form-templates/statement-types";
import { SMART_POLICE_PARTY_ROLE_LABEL } from "@/lib/smart-police/types";
import { statementTitleForRole } from "@/lib/smart-police/statement-form";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyQa(question = ""): StatementQaItem {
  return { id: newId("qa"), question, answer: "" };
}

export function createEmptyPage(seedQuestions?: string[]): StatementPage {
  const qs =
    seedQuestions && seedQuestions.length > 0
      ? seedQuestions
      : ["ขอทราบรายละเอียดเหตุการณ์ตามที่ทราบ", ""];
  return {
    id: newId("page"),
    qa: qs.map((q) => createEmptyQa(q)),
  };
}

export type FillStatementInput = {
  role: SmartPolicePartyRole;
  stationName: string;
  stationAddress?: string | null;
  province?: string | null;
  commanderRank?: string | null;
  commanderName?: string | null;
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  chargeText?: string | null;
  lawRefs?: string | null;
  investigator: string;
  todayThai: string;
  partyName: string;
  partyAge?: string | null;
  partyNationality?: string | null;
  partyIdCard?: string | null;
  partyAddress?: string | null;
  partyPhone?: string | null;
  partyOccupation?: string | null;
  partyWorkplace?: string | null;
  partyCaseRelation?: string | null;
  partyPleaStatus?: string | null;
  behaviorHint?: string | null;
};

function buildHeader(input: FillStatementInput): StatementHeaderFields {
  const commanderLine =
    input.commanderRank && input.commanderName
      ? `${input.commanderRank} ${input.commanderName}`
      : "";
  return {
    stationName: input.stationName.trim() || "สถานีตำรวจ",
    stationAddress: (input.stationAddress ?? "").trim(),
    province: (input.province ?? "").trim(),
    commanderLine,
    caseNumber: input.caseNumber,
    caseTitle: input.caseTitle,
    caseType: input.caseType || "คดีอาญา",
    chargeText: (input.chargeText ?? "").trim(),
    lawRefs: (input.lawRefs ?? "").trim(),
    investigator: input.investigator.trim(),
    todayThai: input.todayThai,
    partyName: input.partyName.trim(),
    partyRoleLabel: SMART_POLICE_PARTY_ROLE_LABEL[input.role],
    partyAge: (input.partyAge ?? "").trim(),
    partyNationality: (input.partyNationality ?? "").trim(),
    partyIdCard: (input.partyIdCard ?? "").trim(),
    partyAddress: (input.partyAddress ?? "").trim(),
    partyPhone: (input.partyPhone ?? "").trim(),
    partyOccupation: (input.partyOccupation ?? "").trim(),
    partyWorkplace: (input.partyWorkplace ?? "").trim(),
    partyCaseRelation: (input.partyCaseRelation ?? "").trim(),
    partyPleaStatus: (input.partyPleaStatus ?? "").trim(),
  };
}

/** สร้างเนื้อหาคำให้การ JSON จากข้อมูลคดี/บุคคล */
export function fillStatementDocument(input: FillStatementInput): StatementDocumentContent {
  const slug = statementTemplateSlugForRole(input.role);
  const hint = (input.behaviorHint ?? "").trim();
  const firstPage = createEmptyPage([
    "ขอทราบรายละเอียดเหตุการณ์ตามที่ทราบ",
    "มีพยานหรือหลักฐานเกี่ยวข้องอย่างไร",
  ]);
  if (hint && firstPage.qa[0]) {
    firstPage.qa[0].answer = hint;
  }
  return {
    templateSlug: slug,
    version: 1,
    header: buildHeader(input),
    pages: [firstPage],
  };
}

export function serializeStatementDocument(doc: StatementDocumentContent): string {
  return JSON.stringify(doc);
}

export function parseStatementDocumentContent(raw: string): StatementDocumentContent | null {
  const t = raw.trim();
  if (!t.startsWith("{") || !t.includes(STATEMENT_CONTENT_MARKER)) return null;
  try {
    const parsed = JSON.parse(t) as StatementDocumentContent;
    if (parsed?.version !== 1 || !parsed.templateSlug || !parsed.header || !Array.isArray(parsed.pages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function statementDocumentTitle(doc: StatementDocumentContent, role: SmartPolicePartyRole): string {
  return `${statementTitleForRole(role)} — ${doc.header.partyName || "ไม่ระบุชื่อ"}`;
}

/** แปลง JSON → ข้อความสำหรับ Word / fallback */
export function statementDocumentToPlainText(doc: StatementDocumentContent): string {
  const h = doc.header;
  const lines: string[] = [
    getStatementTitleFromSlug(doc.templateSlug),
    "",
    h.stationName,
    `เลขที่คดี ${h.caseNumber}`,
    `เรื่อง ${h.caseTitle}`,
    h.chargeText ? `ข้อหา ${h.chargeText}` : "",
    h.lawRefs ? `กฎหมายที่อ้าง ${h.lawRefs}` : "",
    "",
    `ข้าพเจ้า ${h.partyName || "…………"} อายุ ${h.partyAge || "…………"} ปี สัญชาติ ${h.partyNationality || "…………"}`,
    h.partyIdCard ? `เลขประจำตัวประชาชน ${h.partyIdCard}` : "เลขประจำตัวประชาชน ………………………………",
    `อยู่บ้านเลขที่ ${h.partyAddress || "…………………………………………………………………………"}`,
    h.partyPhone ? `โทรศัพท์ ${h.partyPhone}` : "",
    `ในฐานะ${h.partyRoleLabel}`,
    "",
    "ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า",
    "",
  ];

  let qNo = 1;
  doc.pages.forEach((page, pageIdx) => {
    if (doc.pages.length > 1) {
      lines.push(`——— หน้า ${pageIdx + 1} ———`);
    }
    for (const qa of page.qa) {
      const q = qa.question.trim() || "…………………………………………";
      const a = qa.answer.trim() || "…………………………………………………………………………………………………………";
      lines.push(`ถาม ${qNo}. ${q}`);
      lines.push(`ตอบ ${a}`);
      lines.push("");
      qNo += 1;
    }
  });

  lines.push("ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ");
  lines.push("");
  lines.push("ลงชื่อผู้ให้การ ………………………………………");
  lines.push(`(${h.partyName || "……………………………………"})`);
  lines.push("");
  lines.push("ลงชื่อพนักงานสอบสวน ………………………………………");
  lines.push(`(${h.investigator || "……………………………………"})`);
  lines.push("");
  lines.push(`วันที่ ${h.todayThai}`);

  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
}

function getStatementTitleFromSlug(slug: StatementDocumentContent["templateSlug"]): string {
  if (slug === "statement-complainant") return "คำให้การผู้กล่าวหา";
  if (slug === "statement-suspect") return "คำให้การผู้ต้องหา";
  return "คำให้การพยาน";
}

export function isStatementJsonContent(raw: string): boolean {
  return parseStatementDocumentContent(raw) != null;
}

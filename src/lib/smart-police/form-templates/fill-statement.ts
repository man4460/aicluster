import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import {
  getStatementTemplateMeta,
  statementTemplateMetaForRole,
} from "@/lib/smart-police/form-templates/statement-catalog";
import type {
  StatementDocumentContent,
  StatementDocumentContentV1,
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
} from "@/lib/smart-police/form-templates/statement-types";
import {
  STATEMENT_CONTENT_MARKER,
  isStatementDocumentV2,
} from "@/lib/smart-police/form-templates/statement-types";
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

export function buildHeader(input: FillStatementInput): StatementHeaderFields {
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

const FORM_DOC_STYLES = `
.sp-form-root { font-family: "TH Sarabun New","Sarabun",Tahoma,sans-serif; font-size: 15px; line-height: 1.45; color: #111; }
.sp-autofill { background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; }
.sp-autofill-title { font-weight: 700; color: #0c4a6e; margin: 0 0 8px; font-size: 13px; }
.sp-autofill-hint { margin: 8px 0 0; font-size: 12px; color: #0369a1; }
.sp-autofill-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.sp-autofill-table th { text-align: left; width: 9rem; padding: 3px 6px; color: #334155; font-weight: 600; vertical-align: top; }
.sp-autofill-table td { padding: 3px 6px; border-bottom: 1px dotted #cbd5e1; }
.sp-form-sep { border: none; border-top: 1px dashed #94a3b8; margin: 14px 0; }
.sp-form-body table { width: 100%; border-collapse: collapse; }
.sp-form-body td, .sp-form-body th { border: 1px solid #64748b; padding: 4px 6px; vertical-align: top; min-height: 1.2em; }
.sp-form-body p { margin: 0.15em 0; }
`;

export function statementFormDocumentCss(): string {
  return FORM_DOC_STYLES;
}

/** @deprecated ใช้ fillStatementDocument จาก fill-statement-server */
export function fillStatementDocumentSync(input: FillStatementInput): StatementDocumentContentV1 {
  const meta = statementTemplateMetaForRole(input.role);
  const hint = (input.behaviorHint ?? "").trim();
  const firstPage = createEmptyPage([
    "ขอทราบรายละเอียดเหตุการณ์ตามที่ทราบ",
    "มีพยานหรือหลักฐานเกี่ยวข้องอย่างไร",
  ]);
  if (hint && firstPage.qa[0]) firstPage.qa[0].answer = hint;
  return {
    templateSlug: meta.slug,
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
    if (!parsed?.templateSlug || !parsed.header) return null;
    if (parsed.version === 2 && "bodyHtml" in parsed) return parsed;
    if (parsed.version === 1 && Array.isArray((parsed as StatementDocumentContentV1).pages)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function statementDocumentTitle(
  doc: StatementDocumentContent,
  role: SmartPolicePartyRole,
): string {
  return `${statementTitleForRole(role)} — ${doc.header.partyName || "ไม่ระบุชื่อ"}`;
}

export function statementDocumentToPlainText(doc: StatementDocumentContent): string {
  if (isStatementDocumentV2(doc)) {
    const h = doc.header;
    const textish = doc.bodyHtml
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    return `${getStatementTemplateMeta(doc.templateSlug).title}\nเลขที่คดี ${h.caseNumber}\nเรื่อง ${h.caseTitle}\n\n${textish}`;
  }

  const h = doc.header;
  const lines: string[] = [
    getStatementTemplateMeta(doc.templateSlug).title,
    "",
    h.stationName,
    `เลขที่คดี ${h.caseNumber}`,
    `เรื่อง ${h.caseTitle}`,
    "",
  ];
  let qNo = 1;
  for (const page of doc.pages) {
    for (const qa of page.qa) {
      lines.push(`ถาม ${qNo}. ${qa.question.trim() || "…"}`);
      lines.push(`ตอบ ${qa.answer.trim() || "…"}`);
      lines.push("");
      qNo += 1;
    }
  }
  return lines.join("\n");
}

export function isStatementJsonContent(raw: string): boolean {
  return parseStatementDocumentContent(raw) != null;
}

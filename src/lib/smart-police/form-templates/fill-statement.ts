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
      : ["", ""];
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

/** คำถามเริ่มต้นตามบทบาท — พงส. แก้/พิมพ์ต่อได้ */
function seedQuestionsForRole(role: SmartPolicePartyRole, behaviorHint: string): string[] {
  const hint = behaviorHint.trim();
  if (role === "COMPLAINANT") {
    return [
      "ขอทราบชื่อ นามสกุล อายุ อาชีพ และที่อยู่ปัจจุบันของท่าน",
      "ท่านมาให้การในฐานะใด และเกี่ยวข้องกับคดีนี้อย่างไร",
      hint
        ? `ขอให้ท่านเล่าเหตุการณ์ตามที่ทราบเกี่ยวกับ ${hint.slice(0, 80)}${hint.length > 80 ? "…" : ""}`
        : "ขอให้ท่านเล่าเหตุการณ์ที่เกิดขึ้นตามลำดับเวลา",
      "ท่านต้องการให้ดำเนินคดีกับผู้ใด หรือมีข้อเรียกร้องอย่างไร",
    ];
  }
  if (role === "SUSPECT") {
    return [
      "ขอทราบชื่อ นามสกุล อายุ อาชีพ และที่อยู่ปัจจุบันของท่าน",
      "ท่านทราบข้อหาที่ถูกกล่าวหาหรือไม่ และต้องการชี้แจงอย่างไร",
      hint
        ? `เกี่ยวกับพฤติการณ์ที่กล่าวหา (${hint.slice(0, 80)}${hint.length > 80 ? "…" : ""}) ท่านขอชี้แจงว่าอย่างไร`
        : "ขอให้ท่านชี้แจงข้อเท็จจริงตามที่ทราบ",
      "ท่านมีพยานหรือหลักฐานที่จะนำสืบหรือไม่",
    ];
  }
  return [
    "ขอทราบชื่อ นามสกุล อายุ อาชีพ และที่อยู่ปัจจุบันของท่าน",
    "ท่านเกี่ยวข้องหรือรู้เห็นเหตุการณ์ในคดีนี้อย่างไร",
    hint
      ? `ขอให้ท่านเล่าสิ่งที่รู้เห็นเกี่ยวกับ ${hint.slice(0, 80)}${hint.length > 80 ? "…" : ""}`
      : "ขอให้ท่านเล่าสิ่งที่รู้เห็นตามลำดับเวลา",
    "ท่านมีสิ่งใดเพิ่มเติมที่จะให้การหรือไม่",
  ];
}

/**
 * สร้างแบบจำลองฟอร์มคำให้การ — เติมหัวจากคดี/บุคคล + หน้าถาม–ตอบให้พงส. พิมพ์ต่อ
 * (ไม่ดึง fs/Word ใน client path)
 */
export function fillStatementDocument(input: FillStatementInput): StatementDocumentContentV1 {
  const meta = statementTemplateMetaForRole(input.role);
  const hint = (input.behaviorHint ?? "").trim();
  return {
    templateSlug: meta.slug,
    version: 1,
    header: buildHeader(input),
    pages: [createEmptyPage(seedQuestionsForRole(input.role, hint))],
  };
}

/** @deprecated ใช้ fillStatementDocument */
export function fillStatementDocumentSync(input: FillStatementInput): StatementDocumentContentV1 {
  return fillStatementDocument(input);
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
    `ผู้ให้การ ${h.partyName} (${h.partyRoleLabel})`,
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

export function statementFormDocumentCss(): string {
  return "";
}

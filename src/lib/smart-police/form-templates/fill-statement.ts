import type { SmartPolicePartyRole } from "@/generated/prisma/enums";
import {
  getStatementTemplateMeta,
  statementTemplateMetaForRole,
} from "@/lib/smart-police/form-templates/statement-catalog";
import type {
  StatementDocumentContent,
  StatementDocumentContentV1,
  StatementDocumentContentV3,
  StatementHeaderFields,
  StatementPage,
  StatementQaItem,
} from "@/lib/smart-police/form-templates/statement-types";
import {
  STATEMENT_CONTENT_MARKER,
  isStatementDocumentV2,
  isStatementDocumentV3,
  statementDocumentHasPages,
} from "@/lib/smart-police/form-templates/statement-types";
import { splitThaiOfficialDate } from "@/lib/smart-police/form-templates/official-form-date";
import { SMART_POLICE_PARTY_ROLE_LABEL } from "@/lib/smart-police/types";
import { statementTitleForRole } from "@/lib/smart-police/statement-form";

const EMPTY_HEADER_EXTRAS: Pick<
  StatementHeaderFields,
  | "district"
  | "dayThai"
  | "monthThai"
  | "yearThai"
  | "complainantLine"
  | "suspectLine"
  | "interviewPlace"
  | "ethnicity"
  | "religion"
  | "idIssuedOn"
  | "idExpiresOn"
  | "idIssuedAt"
  | "houseNo"
  | "moo"
  | "tambon"
  | "amphoe"
  | "villageHead"
  | "kamnan"
  | "fatherName"
  | "motherName"
  | "relationshipNote"
> = {
  district: "",
  dayThai: "",
  monthThai: "",
  yearThai: "",
  complainantLine: "",
  suspectLine: "",
  interviewPlace: "",
  ethnicity: "",
  religion: "",
  idIssuedOn: "",
  idExpiresOn: "",
  idIssuedAt: "",
  houseNo: "",
  moo: "",
  tambon: "",
  amphoe: "",
  villageHead: "",
  kamnan: "",
  fatherName: "",
  motherName: "",
  relationshipNote: "ไม่เกี่ยวข้อง สาบานตนแล้ว",
};

export function normalizeStatementHeader(
  partial: Partial<StatementHeaderFields> & {
    stationName?: string;
    partyName?: string;
  },
): StatementHeaderFields {
  return {
    stationName: "",
    stationAddress: "",
    province: "",
    commanderLine: "",
    caseNumber: "",
    caseTitle: "",
    caseType: "",
    chargeText: "",
    lawRefs: "",
    investigator: "",
    todayThai: "",
    partyName: "",
    partyRoleLabel: "",
    partyAge: "",
    partyNationality: "",
    partyIdCard: "",
    partyAddress: "",
    partyPhone: "",
    partyOccupation: "",
    partyWorkplace: "",
    partyCaseRelation: "",
    partyPleaStatus: "",
    ...EMPTY_HEADER_EXTRAS,
    ...partial,
  };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyQa(question = ""): StatementQaItem {
  return { id: newId("qa"), question, answer: "" };
}

export function qaListToBodyText(qa: StatementQaItem[]): string {
  const lines: string[] = [];
  let n = 1;
  for (const item of qa) {
    const q = item.question.trim();
    const a = item.answer.trim();
    if (!q && !a) continue;
    if (q) lines.push(`ถาม ${n}. ${q}`);
    if (a) lines.push(`ตอบ ${a}`);
    else if (q) lines.push("ตอบ ");
    lines.push("");
    n += 1;
  }
  return lines.join("\n").trimEnd();
}

export function createEmptyPage(seedQuestions?: string[]): StatementPage {
  const qs =
    seedQuestions && seedQuestions.length > 0
      ? seedQuestions
      : [];
  const qa = qs.length > 0 ? qs.map((q) => createEmptyQa(q)) : [];
  return {
    id: newId("page"),
    text: qaListToBodyText(qa),
    qa,
  };
}

export function normalizeStatementPage(page: Partial<StatementPage> & { id?: string }): StatementPage {
  const qa = Array.isArray(page.qa) ? page.qa : [];
  let text = typeof page.text === "string" ? page.text : "";
  if (!text.trim() && qa.length > 0) text = qaListToBodyText(qa);
  return {
    id: page.id || newId("page"),
    text,
    qa,
  };
}

export type FillStatementInput = {
  role: SmartPolicePartyRole;
  stationName: string;
  stationAddress?: string | null;
  province?: string | null;
  district?: string | null;
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
  complainantLine?: string | null;
  suspectLine?: string | null;
  interviewPlace?: string | null;
  ethnicity?: string | null;
  religion?: string | null;
};

export function buildHeader(input: FillStatementInput): StatementHeaderFields {
  const commanderLine =
    input.commanderRank && input.commanderName
      ? `${input.commanderRank} ${input.commanderName}`
      : "";
  const dates = splitThaiOfficialDate();
  const province = (input.province ?? "").trim();
  return normalizeStatementHeader({
    stationName: input.stationName.trim() || "สถานีตำรวจ",
    stationAddress: (input.stationAddress ?? "").trim(),
    province,
    commanderLine,
    caseNumber: input.caseNumber,
    caseTitle: input.caseTitle,
    caseType: input.caseType || "คดีอาญา",
    chargeText: (input.chargeText ?? "").trim(),
    lawRefs: (input.lawRefs ?? "").trim(),
    investigator: input.investigator.trim(),
    todayThai: input.todayThai || dates.todayThai,
    partyName: input.partyName.trim(),
    partyRoleLabel: SMART_POLICE_PARTY_ROLE_LABEL[input.role],
    partyAge: (input.partyAge ?? "").trim(),
    partyNationality: (input.partyNationality ?? "").trim() || "ไทย",
    partyIdCard: (input.partyIdCard ?? "").trim(),
    partyAddress: (input.partyAddress ?? "").trim(),
    partyPhone: (input.partyPhone ?? "").trim(),
    partyOccupation: (input.partyOccupation ?? "").trim(),
    partyWorkplace: (input.partyWorkplace ?? "").trim(),
    partyCaseRelation: (input.partyCaseRelation ?? "").trim(),
    partyPleaStatus: (input.partyPleaStatus ?? "").trim(),
    district: (input.district ?? "").trim(),
    dayThai: dates.dayThai,
    monthThai: dates.monthThai,
    yearThai: dates.yearThai,
    complainantLine: (input.complainantLine ?? "").trim(),
    suspectLine: (input.suspectLine ?? "").trim(),
    interviewPlace:
      (input.interviewPlace ?? "").trim() ||
      input.stationName.trim() ||
      "สถานีตำรวจ",
    ethnicity: (input.ethnicity ?? "").trim() || "ไทย",
    religion: (input.religion ?? "").trim() || "พุทธ",
  });
}

/** คำถามเริ่มต้นตามบทบาท — พงส. แก้/พิมพ์ต่อได้ */
export function seedQuestionsForRole(role: SmartPolicePartyRole, behaviorHint: string): string[] {
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

/** fallback ถ้าไม่มีไฟล์ Word บนเซิร์ฟเวอร์ */
export function fillStatementDocumentSync(input: FillStatementInput): StatementDocumentContentV1 {
  const meta = statementTemplateMetaForRole(input.role);
  const hint = (input.behaviorHint ?? "").trim();
  return {
    templateSlug: meta.slug,
    version: 1,
    header: buildHeader(input),
    pages: [createEmptyPage(seedQuestionsForRole(input.role, hint))],
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
    parsed.header = normalizeStatementHeader(parsed.header);
    if (parsed.version === 3 && isStatementDocumentV3(parsed)) {
      parsed.pages = parsed.pages.map((p) => normalizeStatementPage(p));
      return parsed;
    }
    if (parsed.version === 2 && "bodyHtml" in parsed) return parsed;
    if (parsed.version === 1 && Array.isArray((parsed as StatementDocumentContentV1).pages)) {
      (parsed as StatementDocumentContentV1).pages = (
        parsed as StatementDocumentContentV1
      ).pages.map((p) => normalizeStatementPage(p));
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

function pagesToPlainText(
  title: string,
  h: StatementHeaderFields,
  pages: StatementPage[],
): string {
  const lines: string[] = [
    title,
    "",
    h.stationName,
    `เลขที่คดี ${h.caseNumber}`,
    `เรื่อง ${h.caseTitle}`,
    `ผู้ให้การ ${h.partyName} (${h.partyRoleLabel})`,
    h.partyPhone ? `โทรศัพท์ ${h.partyPhone}` : "",
    h.partyIdCard ? `บัตรประชาชน ${h.partyIdCard}` : "",
    h.chargeText ? `ข้อหา ${h.chargeText}` : "",
    h.investigator ? `พนักงานสอบสวน ${h.investigator}` : "",
    "",
    "—— บันทึกถาม–ตอบ ——",
    "",
  ].filter((x, i, a) => x !== "" || (i > 0 && a[i - 1] !== ""));

  for (const page of pages) {
    const body = (page.text || "").trim() || qaListToBodyText(page.qa);
    if (body) {
      lines.push(body);
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function statementDocumentToPlainText(doc: StatementDocumentContent): string {
  const title = getStatementTemplateMeta(doc.templateSlug).title;
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
    return `${title}\nเลขที่คดี ${h.caseNumber}\nเรื่อง ${h.caseTitle}\n\n${textish}`;
  }
  if (statementDocumentHasPages(doc)) {
    return pagesToPlainText(title, doc.header, doc.pages);
  }
  return title;
}

export function isStatementJsonContent(raw: string): boolean {
  return parseStatementDocumentContent(raw) != null;
}

/** ดึงข้อความสำหรับสร้าง .docx จาก content ดิบ (JSON หรือข้อความ) */
export function statementContentBodyTextForWord(raw: string): string {
  const parsed = parseStatementDocumentContent(raw);
  if (parsed) return statementDocumentToPlainText(parsed);
  return raw;
}

export function ensureStatementPagesDoc(
  doc: StatementDocumentContent,
): StatementDocumentContentV1 | StatementDocumentContentV3 {
  if (statementDocumentHasPages(doc)) return doc;
  // v2 → แปลงเป็นโครงถาม–ตอบโดยเก็บ header
  return {
    templateSlug: doc.templateSlug,
    version: 1,
    header: doc.header,
    pages: [
      createEmptyPage([
        "ขอทราบรายละเอียดเหตุการณ์ตามที่ทราบ",
        "มีพยานหรือหลักฐานเกี่ยวข้องอย่างไร",
      ]),
    ],
  };
}

export type { StatementDocumentContentV3 };

import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const LINEUP_ID_LINE_MM = 6.2;
export const LINEUP_ID_PAGE_INNER_MM = 273;
export const LINEUP_ID_HEADER_MM = 140;
export const LINEUP_ID_PAGE_NO_MM = 12;
export const LINEUP_ID_CLOSING_MM = 18;
export const LINEUP_ID_SIGNS_MM = 64;
export const LINEUP_ID_PERSON_COUNT = 8;
export const LINEUP_ID_ANSWER_MIN = 4;

export const LINEUP_ID_ANSWER_FIELD = {
  key: "answer" as const,
  label: "๕. คำตอบผู้ต้องหา",
  minLines: LINEUP_ID_ANSWER_MIN,
};

export type LineupIdFlowFieldKey = typeof LINEUP_ID_ANSWER_FIELD.key;

export type LineupIdPageBodySlice = {
  key: LineupIdFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type LineupIdPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  answer: LineupIdPageBodySlice | null;
  showClosing: boolean;
  showSigns: boolean;
};

export type LineupIdFields = {
  recordPlace: string;
  day: string;
  month: string;
  year: string;
  director: string;
  complainant: string;
  suspectName: string;
  criminalCaseNo: string;
  criminalCharge: string;
  idPlace: string;
  idDay: string;
  idMonth: string;
  idYear: string;
  idTime: string;
  personCount: string;
  people: string[];
  answer: string;
  signSuspect: string;
  signSuspectParen: string;
  signWitness1: string;
  signWitness1Paren: string;
  signWitness2: string;
  signWitness2Paren: string;
  signDirector: string;
  signDirectorParen: string;
  signOfficer: string;
  signOfficerParen: string;
};

export function createEmptyLineupIdFields(): LineupIdFields {
  return {
    recordPlace: "",
    day: "",
    month: "",
    year: "",
    director: "",
    complainant: "",
    suspectName: "",
    criminalCaseNo: "",
    criminalCharge: "",
    idPlace: "",
    idDay: "",
    idMonth: "",
    idYear: "",
    idTime: "",
    personCount: "",
    people: Array.from({ length: LINEUP_ID_PERSON_COUNT }, () => ""),
    answer: "",
    signSuspect: "",
    signSuspectParen: "",
    signWitness1: "",
    signWitness1Paren: "",
    signWitness2: "",
    signWitness2Paren: "",
    signDirector: "",
    signDirectorParen: "",
    signOfficer: "",
    signOfficerParen: "",
  };
}

function emptyPage(index: number): LineupIdPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    answer: null,
    showClosing: false,
    showSigns: false,
  };
}

export function packLineupIdPages(
  fields: LineupIdFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): LineupIdPageModel[] {
  const pages: LineupIdPageModel[] = [];
  let page = emptyPage(0);
  let used = LINEUP_ID_HEADER_MM;

  function remaining(): number {
    return LINEUP_ID_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = LINEUP_ID_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  const footerMm = LINEUP_ID_CLOSING_MM + LINEUP_ID_SIGNS_MM;
  const footerLines = Math.ceil(footerMm / LINEUP_ID_LINE_MM);

  let rest = fields.answer;
  let first = true;
  let sliceIndex = 0;
  while (true) {
    const indentCh = 0;
    const contentLines = countLines(rest, indentCh);
    const rawAvail = Math.floor(remaining() / LINEUP_ID_LINE_MM);
    if (rawAvail < 1) {
      flush();
      continue;
    }
    const availKeepFooter = Math.max(LINEUP_ID_ANSWER_FIELD.minLines, rawAvail - footerLines);
    const wanted = Math.max(
      first ? Math.max(LINEUP_ID_ANSWER_FIELD.minLines, availKeepFooter) : 1,
      contentLines,
    );
    const keepFooterHere = wanted <= availKeepFooter;
    const takeLines = keepFooterHere ? wanted : Math.min(rawAvail, wanted);
    const [head, tail] =
      contentLines > takeLines
        ? splitArrestTextByLines(rest, takeLines, indentCh, countLines)
        : [rest, ""];
    if (!head && tail) {
      flush();
      continue;
    }
    page.answer = {
      key: LINEUP_ID_ANSWER_FIELD.key,
      label: LINEUP_ID_ANSWER_FIELD.label,
      text: head,
      lines: takeLines,
      showLabel: false,
      sliceIndex,
    };
    used += takeLines * LINEUP_ID_LINE_MM + 0.4;
    rest = tail;
    first = false;
    sliceIndex += 1;
    if (!rest) break;
    flush();
  }

  need(LINEUP_ID_CLOSING_MM + LINEUP_ID_SIGNS_MM);
  page.showClosing = true;
  page.showSigns = true;

  pages.push(page);
  return pages;
}

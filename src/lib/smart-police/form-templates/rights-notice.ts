import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const RIGHTS_NOTICE_LINE_MM = 7.2;
export const RIGHTS_NOTICE_PAGE_INNER_MM = 273;
export const RIGHTS_NOTICE_HEADER_MM = 128;
export const RIGHTS_NOTICE_PAGE_NO_MM = 12;
export const RIGHTS_NOTICE_META_MM = 9.8;
export const RIGHTS_NOTICE_CLOSING_MM = 19.6;
export const RIGHTS_NOTICE_SIGNS_MM = 24;

export const RIGHTS_NOTICE_CHARGE_FIELD = {
  key: "charge" as const,
  label: "ถูกจับข้อหา",
  minLines: 4,
};

export type RightsNoticeFlowFieldKey = typeof RIGHTS_NOTICE_CHARGE_FIELD.key;

export type RightsNoticePageBodySlice = {
  key: RightsNoticeFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type RightsNoticePageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  charge: RightsNoticePageBodySlice | null;
  showMeta: boolean;
  showClosing: boolean;
  showSigns: boolean;
};

export type RightsNoticeFields = {
  recordPlace: string;
  day: string;
  month: string;
  year: string;
  time: string;
  officer: string;
  officerRank: string;
  name: string;
  ethnicity: string;
  nationality: string;
  age: string;
  charge: string;
  arrestDay: string;
  arrestMonth: string;
  arrestYear: string;
  dailyLogItem: string;
  signAccused: string;
  signRecorder: string;
  recorderPosition: string;
  signWitness: string;
};

export function createEmptyRightsNoticeFields(): RightsNoticeFields {
  return {
    recordPlace: "",
    day: "",
    month: "",
    year: "",
    time: "",
    officer: "",
    officerRank: "",
    name: "",
    ethnicity: "",
    nationality: "",
    age: "",
    charge: "",
    arrestDay: "",
    arrestMonth: "",
    arrestYear: "",
    dailyLogItem: "",
    signAccused: "",
    signRecorder: "",
    recorderPosition: "",
    signWitness: "",
  };
}

function emptyPage(index: number): RightsNoticePageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    charge: null,
    showMeta: false,
    showClosing: false,
    showSigns: false,
  };
}

export function packRightsNoticePages(
  fields: RightsNoticeFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): RightsNoticePageModel[] {
  const pages: RightsNoticePageModel[] = [];
  let page = emptyPage(0);
  let used = RIGHTS_NOTICE_HEADER_MM;

  function remaining(): number {
    return RIGHTS_NOTICE_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = RIGHTS_NOTICE_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  let rest = fields.charge;
  let first = true;
  let sliceIndex = 0;
  while (true) {
    const indentCh = first ? RIGHTS_NOTICE_CHARGE_FIELD.label.length + 1 : 0;
    const contentLines = countLines(rest, indentCh);
    const wanted = Math.max(first ? RIGHTS_NOTICE_CHARGE_FIELD.minLines : 1, contentLines);
    const availLines = Math.floor(remaining() / RIGHTS_NOTICE_LINE_MM);
    if (availLines < 1) {
      flush();
      continue;
    }
    const takeLines = Math.min(availLines, wanted);
    const [head, tail] =
      contentLines > takeLines
        ? splitArrestTextByLines(rest, takeLines, indentCh, countLines)
        : [rest, ""];
    if (!head && tail) {
      flush();
      continue;
    }
    page.charge = {
      key: RIGHTS_NOTICE_CHARGE_FIELD.key,
      label: RIGHTS_NOTICE_CHARGE_FIELD.label,
      text: head,
      lines: takeLines,
      showLabel: first,
      sliceIndex,
    };
    used += takeLines * RIGHTS_NOTICE_LINE_MM + 0.4;
    rest = tail;
    first = false;
    sliceIndex += 1;
    if (!rest) break;
    flush();
  }

  need(RIGHTS_NOTICE_META_MM + RIGHTS_NOTICE_CLOSING_MM + RIGHTS_NOTICE_SIGNS_MM);
  page.showMeta = true;
  page.showClosing = true;
  page.showSigns = true;

  pages.push(page);
  return pages;
}

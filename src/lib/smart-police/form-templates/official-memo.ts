import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const OFFICIAL_MEMO_LINE_MM = 7.2;
export const OFFICIAL_MEMO_PAGE_INNER_MM = 273;
export const OFFICIAL_MEMO_HEADER_MM = 65.4;
export const OFFICIAL_MEMO_PAGE_NO_MM = 12;
export const OFFICIAL_MEMO_BODY_GAP_MM = 4.6;
export const OFFICIAL_MEMO_SIGNS_MM = 29.4;
export const OFFICIAL_MEMO_BODY_MIN_LINES = 8;
export const OFFICIAL_MEMO_FIRST_INDENT_CH = 5;

export type OfficialMemoPageSlice = {
  text: string;
  lines: number;
  sliceIndex: number;
  indent: boolean;
};

export type OfficialMemoPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  body: OfficialMemoPageSlice[];
  showSigns: boolean;
};

export type OfficialMemoFields = {
  agency: string;
  phone: string;
  docNo: string;
  docDate: string;
  subject: string;
  toName: string;
  body: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
};

export function createEmptyOfficialMemoFields(): OfficialMemoFields {
  return {
    agency: "",
    phone: "",
    docNo: "",
    docDate: "",
    subject: "",
    toName: "",
    body: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
  };
}

function emptyPage(index: number): OfficialMemoPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    body: [],
    showSigns: false,
  };
}

export function packOfficialMemoPages(
  fields: OfficialMemoFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): OfficialMemoPageModel[] {
  const pages: OfficialMemoPageModel[] = [];
  let page = emptyPage(0);
  let used = OFFICIAL_MEMO_HEADER_MM + OFFICIAL_MEMO_BODY_GAP_MM;

  function remaining(): number {
    return OFFICIAL_MEMO_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = OFFICIAL_MEMO_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  let rest = fields.body;
  let first = true;
  let sliceIndex = 0;
  let placed = 0;
  let hops = 0;
  while (hops++ < 400) {
    const indentCh = first ? OFFICIAL_MEMO_FIRST_INDENT_CH : 0;
    const contentLines = countLines(rest, indentCh);
    const availLines = Math.floor(remaining() / OFFICIAL_MEMO_LINE_MM);
    if (availLines < 1) {
      flush();
      continue;
    }
    const stillNeed = Math.max(OFFICIAL_MEMO_BODY_MIN_LINES - placed, contentLines, 1);
    const takeLines = Math.min(availLines, stillNeed);
    const [head, tail] =
      contentLines > takeLines
        ? splitArrestTextByLines(rest, takeLines, indentCh, countLines)
        : [rest, ""];
    if (!head && tail) {
      flush();
      continue;
    }
    page.body.push({
      text: head,
      lines: takeLines,
      sliceIndex,
      indent: first,
    });
    used += takeLines * OFFICIAL_MEMO_LINE_MM + 0.4;
    placed += takeLines;
    rest = tail;
    first = false;
    sliceIndex += 1;
    if (!rest && placed >= OFFICIAL_MEMO_BODY_MIN_LINES) break;
    if (rest) flush();
  }

  need(OFFICIAL_MEMO_SIGNS_MM);
  page.showSigns = true;
  pages.push(page);
  return pages;
}

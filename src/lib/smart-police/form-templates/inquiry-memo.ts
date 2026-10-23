import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const INQUIRY_MEMO_LINE_MM = 8.2;
export const INQUIRY_MEMO_ROWS_FIRST = 26;
export const INQUIRY_MEMO_ROWS_CONT = 25;

export type InquiryMemoFields = {
  station: string;
  district: string;
  province: string;
  dateCol: string;
  notes: string;
  signCol: string;
};

export function createEmptyInquiryMemoFields(): InquiryMemoFields {
  return {
    station: "",
    district: "",
    province: "",
    dateCol: "",
    notes: "",
    signCol: "",
  };
}

export type InquiryMemoPageModel = {
  index: number;
  showPageNo: boolean;
  rows: number;
  dateCol: string;
  notes: string;
  signCol: string;
  sliceIndex: number;
};

export type InquiryMemoLineCounters = {
  date: (text: string) => number;
  notes: (text: string) => number;
  sign: (text: string) => number;
};

function estimateWithWidth(text: string, charsPerLine: number): number {
  if (!text) return 0;
  const paras = text.replace(/\r/g, "").split("\n");
  let n = 0;
  for (const p of paras) {
    n += Math.max(1, Math.ceil(Math.max(p.length, 1) / Math.max(4, charsPerLine)));
  }
  return n;
}

export const defaultInquiryMemoCounters: InquiryMemoLineCounters = {
  date: (t) => estimateWithWidth(t, 8),
  notes: (t) => (t ? estimateArrestWrappedLines(t, 0) : 0),
  sign: (t) => estimateWithWidth(t, 12),
};

function splitText(text: string, maxLines: number, count: (t: string) => number): [string, string] {
  return splitArrestTextByLines(text, maxLines, 0, (t) => count(t));
}

export function packInquiryMemoPages(
  fields: InquiryMemoFields,
  count: InquiryMemoLineCounters = defaultInquiryMemoCounters,
): InquiryMemoPageModel[] {
  let restDate = fields.dateCol;
  let restNotes = fields.notes;
  let restSign = fields.signCol;
  const pages: InquiryMemoPageModel[] = [];
  let sliceIndex = 0;

  function take(rows: number) {
    const [dHead, dTail] = splitText(restDate, rows, count.date);
    const [nHead, nTail] = splitText(restNotes, rows, count.notes);
    const [sHead, sTail] = splitText(restSign, rows, count.sign);
    pages.push({
      index: pages.length,
      showPageNo: pages.length > 0,
      rows,
      dateCol: dHead,
      notes: nHead,
      signCol: sHead,
      sliceIndex,
    });
    restDate = dTail;
    restNotes = nTail;
    restSign = sTail;
    sliceIndex += 1;
  }

  take(INQUIRY_MEMO_ROWS_FIRST);
  while (restDate || restNotes || restSign) {
    take(INQUIRY_MEMO_ROWS_CONT);
  }
  return pages;
}

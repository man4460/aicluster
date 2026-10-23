import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const CUSTODY_LOG_LINE_MM = 7.2;
export const CUSTODY_LOG_ROWS_FIRST = 26;
export const CUSTODY_LOG_ROWS_CONT = 31;

export const CUSTODY_LOG_NOTE_1 =
  "๑. รายการควบคุมนี้ต้องลงทุกวัน ถ้าส่งตัวไปศาลสั่งขัง ให้ขีดเส้นแดงไว้กั้นตอนกับการควบคุม แล้วลงรายการขึ้นศาลขังต่อไป";
export const CUSTODY_LOG_NOTE_2 =
  "๒. การลงชื่อของพนักงานสอบสวนและหัวหน้าพนักงานสอบสวน ต้องลงทุกวันที่มีการลงรายการ";

export type CustodyLogFields = {
  caseNo: string;
  station: string;
  complainantLine: string;
  suspectLine: string;
  charge: string;
  startWhen: string;
  dateCol: string;
  actionCol: string;
  investigatorCol: string;
  chiefCol: string;
};

export function createEmptyCustodyLogFields(): CustodyLogFields {
  return {
    caseNo: "",
    station: "",
    complainantLine: "",
    suspectLine: "",
    charge: "",
    startWhen: "",
    dateCol: "",
    actionCol: "",
    investigatorCol: "",
    chiefCol: "",
  };
}

export type CustodyLogPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  showNotes: boolean;
  rows: number;
  dateCol: string;
  actionCol: string;
  investigatorCol: string;
  chiefCol: string;
  sliceIndex: number;
};

export type CustodyLogLineCounters = {
  date: (text: string) => number;
  action: (text: string) => number;
  investigator: (text: string) => number;
  chief: (text: string) => number;
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

export const defaultCustodyLogCounters: CustodyLogLineCounters = {
  date: (t) => estimateWithWidth(t, 8),
  action: (t) => (t ? estimateArrestWrappedLines(t, 0) : 0),
  investigator: (t) => estimateWithWidth(t, 10),
  chief: (t) => estimateWithWidth(t, 10),
};

function splitText(text: string, maxLines: number, count: (t: string) => number): [string, string] {
  return splitArrestTextByLines(text, maxLines, 0, (t) => count(t));
}

export function packCustodyLogPages(
  fields: CustodyLogFields,
  count: CustodyLogLineCounters = defaultCustodyLogCounters,
): CustodyLogPageModel[] {
  let restDate = fields.dateCol;
  let restAction = fields.actionCol;
  let restInv = fields.investigatorCol;
  let restChief = fields.chiefCol;
  const pages: CustodyLogPageModel[] = [];
  let sliceIndex = 0;

  function leftover() {
    return Boolean(restDate || restAction || restInv || restChief);
  }

  function take(rows: number) {
    const [dHead, dTail] = splitText(restDate, rows, count.date);
    const [aHead, aTail] = splitText(restAction, rows, count.action);
    const [iHead, iTail] = splitText(restInv, rows, count.investigator);
    const [cHead, cTail] = splitText(restChief, rows, count.chief);
    pages.push({
      index: pages.length,
      showHeader: pages.length === 0,
      showPageNo: pages.length > 0,
      showNotes: false,
      rows,
      dateCol: dHead,
      actionCol: aHead,
      investigatorCol: iHead,
      chiefCol: cHead,
      sliceIndex,
    });
    restDate = dTail;
    restAction = aTail;
    restInv = iTail;
    restChief = cTail;
    sliceIndex += 1;
  }

  take(CUSTODY_LOG_ROWS_FIRST);
  do {
    take(CUSTODY_LOG_ROWS_CONT);
  } while (leftover());
  pages[pages.length - 1].showNotes = true;
  return pages;
}

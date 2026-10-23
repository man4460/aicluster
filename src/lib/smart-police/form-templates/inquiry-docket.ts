import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export type InquiryDocketHeader = {
  caseNo: string;
  station: string;
  district: string;
  province: string;
  signName: string;
};

export type InquiryDocketRow = {
  id: string;
  kind: string;
  from: string;
  to: string;
  qty: string;
};

/** ค่าเริ่ม — ลำดับที่ ๑–๓ เท่านั้น */
export const INQUIRY_DOCKET_DEFAULT_ROWS = 3;

/** บรรทัดข้อมูลที่พอในหน้า 1 (หลังหัวครุฑ + คดีที่ + หัวตาราง + รวมเอกสาร + ลงชื่อ) */
export const INQUIRY_DOCKET_LINES_FIRST = 29;
/** บรรทัดข้อมูลหน้า 2+ */
export const INQUIRY_DOCKET_LINES_CONT = 34;

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

export function parseInquiryDocketQty(raw: string): number {
  let digits = "";
  for (const ch of raw) {
    const thai = THAI_DIGITS.indexOf(ch);
    if (thai >= 0) digits += String(thai);
    else if (ch >= "0" && ch <= "9") digits += ch;
  }
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

export function isInquiryDocketRowFilled(row: InquiryDocketRow): boolean {
  return Boolean(row.kind.trim() || row.from.trim() || row.to.trim() || row.qty.trim());
}

export function summarizeInquiryDocket(rows: InquiryDocketRow[]): { items: number; sheets: number } {
  return {
    items: rows.filter(isInquiryDocketRowFilled).length,
    sheets: rows.reduce((sum, row) => sum + parseInquiryDocketQty(row.qty), 0),
  };
}

export type InquiryDocketLineCounters = {
  kind: (text: string) => number;
  from: (text: string) => number;
  to: (text: string) => number;
  qty: (text: string) => number;
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

export const defaultInquiryDocketCounters: InquiryDocketLineCounters = {
  kind: (t) => (t ? estimateWithWidth(t, 22) : 0),
  from: (t) => (t ? estimateWithWidth(t, 10) : 0),
  to: (t) => (t ? estimateWithWidth(t, 10) : 0),
  qty: (t) => (t ? estimateArrestWrappedLines(t, 0) : 0),
};

export type InquiryDocketPageRow = {
  rowId: string;
  seq: number;
  fragIndex: number;
  showSeq: boolean;
  kind: string;
  from: string;
  to: string;
  qty: string;
};

export type InquiryDocketPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  showFooter: boolean;
  rows: InquiryDocketPageRow[];
};

function newId(): string {
  return `dk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyInquiryDocketHeader(): InquiryDocketHeader {
  return {
    caseNo: "",
    station: "",
    district: "",
    province: "",
    signName: "",
  };
}

export function createEmptyInquiryDocketRow(): InquiryDocketRow {
  return {
    id: newId(),
    kind: "",
    from: "",
    to: "",
    qty: "",
  };
}

export function createDefaultInquiryDocketRows(count = INQUIRY_DOCKET_DEFAULT_ROWS): InquiryDocketRow[] {
  return Array.from({ length: Math.max(1, count) }, () => createEmptyInquiryDocketRow());
}

function splitText(text: string, maxLines: number, count: (t: string) => number): [string, string] {
  return splitArrestTextByLines(text, maxLines, 0, (t) => count(t));
}

function rowLines(row: Pick<InquiryDocketRow, "kind" | "from" | "to" | "qty">, count: InquiryDocketLineCounters): number {
  return Math.max(1, count.kind(row.kind), count.from(row.from), count.to(row.to), count.qty(row.qty));
}

export function packInquiryDocketPages(
  rows: InquiryDocketRow[],
  count: InquiryDocketLineCounters = defaultInquiryDocketCounters,
): InquiryDocketPageModel[] {
  const pages: InquiryDocketPageModel[] = [];
  let current: InquiryDocketPageRow[] = [];
  let used = 0;
  let budget = INQUIRY_DOCKET_LINES_FIRST;

  function flush() {
    pages.push({
      index: pages.length,
      showHeader: pages.length === 0,
      showPageNo: pages.length > 0,
      showFooter: false,
      rows: current,
    });
    current = [];
    used = 0;
    budget = INQUIRY_DOCKET_LINES_CONT;
  }

  rows.forEach((row, rowIdx) => {
    const seq = rowIdx + 1;
    let restKind = row.kind;
    let restFrom = row.from;
    let restTo = row.to;
    let restQty = row.qty;
    let fragIndex = 0;
    let hops = 0;

    while (hops++ < 400) {
      const rest = { kind: restKind, from: restFrom, to: restTo, qty: restQty };
      const need = rowLines(rest, count);
      const space = budget - used;

      if (need <= space) {
        current.push({
          rowId: row.id,
          seq,
          fragIndex,
          showSeq: fragIndex === 0,
          kind: restKind,
          from: restFrom,
          to: restTo,
          qty: fragIndex === 0 ? restQty : "",
        });
        used += need;
        break;
      }

      if (space <= 0) {
        flush();
        continue;
      }

      const [kHead, kTail] = splitText(restKind, space, count.kind);
      const [fHead, fTail] = splitText(restFrom, space, count.from);
      const [tHead, tTail] = splitText(restTo, space, count.to);
      current.push({
        rowId: row.id,
        seq,
        fragIndex,
        showSeq: fragIndex === 0,
        kind: kHead,
        from: fHead,
        to: tHead,
        qty: fragIndex === 0 ? restQty : "",
      });
      used += space;
      flush();
      restKind = kTail;
      restFrom = fTail;
      restTo = tTail;
      restQty = "";
      fragIndex += 1;
      if (!restKind && !restFrom && !restTo) break;
    }
  });

  if (current.length > 0 || pages.length === 0) flush();
  pages[pages.length - 1].showFooter = true;
  return pages;
}

export function paginateInquiryDocketRows(rows: InquiryDocketRow[]): InquiryDocketRow[][] {
  return packInquiryDocketPages(rows).map((page) =>
    page.rows.map((r) => ({
      id: `${r.rowId}-${r.fragIndex}`,
      kind: r.kind,
      from: r.from,
      to: r.to,
      qty: r.qty,
    })),
  );
}

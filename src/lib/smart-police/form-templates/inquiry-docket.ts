export type InquiryDocketHeader = {
  caseNo: string;
  station: string;
  district: string;
  province: string;
  totalCopies: string;
  totalSheets: string;
};

export type InquiryDocketRow = {
  id: string;
  kind: string;
  from: string;
  to: string;
  copies: string;
  sheets: string;
};

export const INQUIRY_DOCKET_ROWS_FIRST = 14;
export const INQUIRY_DOCKET_ROWS_CONT = 18;
export const INQUIRY_DOCKET_DEFAULT_ROWS = INQUIRY_DOCKET_ROWS_FIRST + INQUIRY_DOCKET_ROWS_CONT;

function newId(): string {
  return `dk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyInquiryDocketHeader(): InquiryDocketHeader {
  return {
    caseNo: "",
    station: "",
    district: "",
    province: "",
    totalCopies: "",
    totalSheets: "",
  };
}

export function createEmptyInquiryDocketRow(): InquiryDocketRow {
  return {
    id: newId(),
    kind: "",
    from: "",
    to: "",
    copies: "",
    sheets: "",
  };
}

export function createDefaultInquiryDocketRows(count = INQUIRY_DOCKET_DEFAULT_ROWS): InquiryDocketRow[] {
  return Array.from({ length: Math.max(1, count) }, () => createEmptyInquiryDocketRow());
}

export function paginateInquiryDocketRows(rows: InquiryDocketRow[]): InquiryDocketRow[][] {
  if (rows.length <= INQUIRY_DOCKET_ROWS_FIRST) return [rows];
  const pages: InquiryDocketRow[][] = [rows.slice(0, INQUIRY_DOCKET_ROWS_FIRST)];
  for (let i = INQUIRY_DOCKET_ROWS_FIRST; i < rows.length; i += INQUIRY_DOCKET_ROWS_CONT) {
    pages.push(rows.slice(i, i + INQUIRY_DOCKET_ROWS_CONT));
  }
  return pages;
}

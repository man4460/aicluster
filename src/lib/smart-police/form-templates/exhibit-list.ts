import {
  createDefaultPropertyListRows,
  createEmptyPropertyListRow,
  formatPropertyListTotal,
  type PropertyListHeader,
  type PropertyListRow,
} from "@/lib/smart-police/form-templates/property-list";

export type ExhibitListHeader = PropertyListHeader & {
  accountNo: string;
};

export const EXHIBIT_LIST_ROWS_FIRST = 10;
export const EXHIBIT_LIST_ROWS_CONT = 16;

export function createEmptyExhibitListHeader(): ExhibitListHeader {
  return {
    accountNo: "",
    stationName: "",
    caseNumber: "",
    datedOn: "",
    complainantLine: "",
    suspectLine: "",
    chargeText: "",
    chargeLine2: "",
    signSuspect: "",
    signComplainant: "",
    signWitness: "",
    signOfficer: "",
  };
}

export function createEmptyExhibitListRow(): PropertyListRow {
  return createEmptyPropertyListRow();
}

export function createDefaultExhibitListRows(count?: number): PropertyListRow[] {
  return createDefaultPropertyListRows(count);
}

export function formatExhibitListTotal(rows: PropertyListRow[]) {
  return formatPropertyListTotal(rows);
}

/** หน้าต่อเฉพาะเมื่อรายการล้นหน้า 1 */
export function paginateExhibitListRows(rows: PropertyListRow[]): PropertyListRow[][] {
  if (rows.length <= EXHIBIT_LIST_ROWS_FIRST) return [rows];
  const pages: PropertyListRow[][] = [rows.slice(0, EXHIBIT_LIST_ROWS_FIRST)];
  for (let i = EXHIBIT_LIST_ROWS_FIRST; i < rows.length; i += EXHIBIT_LIST_ROWS_CONT) {
    pages.push(rows.slice(i, i + EXHIBIT_LIST_ROWS_CONT));
  }
  return pages;
}

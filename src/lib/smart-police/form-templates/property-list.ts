export type PropertyListHeader = {
  stationName: string;
  caseNumber: string;
  datedOn: string;
  complainantLine: string;
  suspectLine: string;
  chargeText: string;
  chargeLine2: string;
  signSuspect: string;
  signComplainant: string;
  signWitness: string;
  signOfficer: string;
};

export type PropertyListRow = {
  id: string;
  item: string;
  quantity: string;
  baht: string;
  satang: string;
  owner: string;
  seizedOn: string;
  note: string;
};

export const PROPERTY_LIST_ROWS_FIRST = 10;
export const PROPERTY_LIST_ROWS_CONT = 16;
export const PROPERTY_LIST_DEFAULT_ROWS = 3;

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyPropertyListHeader(): PropertyListHeader {
  return {
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

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

export function thaiNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => THAI_DIGITS[Number(d)] ?? d);
}

export function thaiGroupedNumeral(n: number): string {
  return n.toLocaleString("en-US").replace(/\d/g, (d) => THAI_DIGITS[Number(d)] ?? d);
}

/** เลขไทย ๐–๙ · เลขอารบิก · จุลภาค/ช่องว่าง — คืนจำนวนเต็ม (ว่าง = ๐) */
export function parseThaiInt(raw: string): number {
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

export function createEmptyPropertyListRow(): PropertyListRow {
  return {
    id: newId("pl"),
    item: "",
    quantity: "",
    baht: "",
    satang: "",
    owner: "",
    seizedOn: "",
    note: "",
  };
}

export function createDefaultPropertyListRows(count = PROPERTY_LIST_DEFAULT_ROWS): PropertyListRow[] {
  return Array.from({ length: count }, () => createEmptyPropertyListRow());
}

export function moneySatang(baht: string, satang: string): number {
  const b = parseThaiInt(baht);
  const s = Math.min(99, parseThaiInt(satang));
  return b * 100 + s;
}

export function formatPropertyListTotal(rows: PropertyListRow[]): {
  items: number;
  itemsThai: string;
  baht: string;
  satang: string;
} {
  const filled = rows.filter((r) => r.item.trim() || r.quantity.trim() || r.baht.trim() || r.satang.trim());
  const total = rows.reduce((sum, r) => sum + moneySatang(r.baht, r.satang), 0);
  const baht = Math.floor(total / 100);
  const satang = total % 100;
  return {
    items: filled.length,
    itemsThai: thaiNumeral(filled.length),
    baht: thaiGroupedNumeral(baht),
    satang: thaiNumeral(satang).padStart(2, "๐"),
  };
}

export function paginatePropertyListRows(rows: PropertyListRow[]): PropertyListRow[][] {
  if (rows.length <= PROPERTY_LIST_ROWS_FIRST) return [rows];
  const pages: PropertyListRow[][] = [rows.slice(0, PROPERTY_LIST_ROWS_FIRST)];
  for (let i = PROPERTY_LIST_ROWS_FIRST; i < rows.length; i += PROPERTY_LIST_ROWS_CONT) {
    pages.push(rows.slice(i, i + PROPERTY_LIST_ROWS_CONT));
  }
  return pages;
}

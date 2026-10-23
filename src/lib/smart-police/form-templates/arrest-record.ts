export const ARREST_SIGN_MIN = 1;
export const ARREST_SIGN_DEFAULT = 2;
export const ARREST_SIGN_ROW_MM = 6.7;
export const ARREST_SIGN_GROUP_GAP_MM = 3;
export const ARREST_RECORDER_MM = 8;

export const ARREST_LINE_MM = 7.2;
export const ARREST_PAGE_INNER_MM = 273;
export const ARREST_HEADER_MM = 74;
export const ARREST_PAGE_NO_MM = 12;
export const ARREST_RIGHTS13_MM = 32;
export const ARREST_RIGHTS4_MM = 28;
export const ARREST_STATEMENT_LEAD_MM = 8;
export const ARREST_INCIDENT_CERT_MM = 50;
export type ArrestSignSlice = {
  start: number;
  count: number;
};

export const ARREST_BODY_FIELDS = [
  { key: "officers", label: "เจ้าพนักงานตำรวจผู้จับกุม", minLines: 4 },
  { key: "arrestees", label: "ได้ร่วมกันจับกุมตัว", minLines: 4 },
  { key: "exhibits", label: "พร้อมด้วยของกลางมี", minLines: 3 },
  { key: "exhibitFoundAt", label: "ตำแหน่งที่พบของกลาง", minLines: 3 },
  { key: "charge", label: "โดยกล่าวหาว่า", minLines: 4 },
] as const;

export type ArrestFlowFieldKey = (typeof ARREST_BODY_FIELDS)[number]["key"] | "statement";

export type ArrestPageBodySlice = {
  key: ArrestFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type ArrestPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  body: ArrestPageBodySlice[];
  showRights13: boolean;
  showRights4: boolean;
  showStatementLead: boolean;
  statement: ArrestPageBodySlice | null;
  showIncidentCert: boolean;
  signArresteeSlice: ArrestSignSlice | null;
  signOfficerSlice: ArrestSignSlice | null;
  showRecorder: boolean;
};

export function estimateArrestWrappedLines(text: string, indentCh: number): number {
  if (!text) return 0;
  const charsPerLine = 35;
  const paras = text.replace(/\r/g, "").split("\n");
  let n = 0;
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    const width = i === 0 ? Math.max(10, charsPerLine - Math.max(0, indentCh)) : charsPerLine;
    n += Math.max(1, Math.ceil(Math.max(p.length, 1) / width));
  }
  return n;
}

export function splitArrestTextByLines(
  text: string,
  maxLines: number,
  indentCh: number,
  countLines: (text: string, indentCh: number) => number,
): [string, string] {
  if (maxLines <= 0) return ["", text];
  if (!text) return ["", ""];
  if (countLines(text, indentCh) <= maxLines) return [text, ""];
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (countLines(text.slice(0, mid), indentCh) <= maxLines) lo = mid;
    else hi = mid - 1;
  }
  let cut = lo;
  if (cut > 0 && cut < text.length) {
    const sp = Math.max(text.lastIndexOf(" ", cut), text.lastIndexOf("\n", cut));
    if (sp >= Math.floor(cut * 0.45)) cut = sp + 1;
  }
  if (cut <= 0) cut = Math.min(text.length, Math.max(1, lo));
  return [text.slice(0, cut), text.slice(cut).replace(/^[ ]+/, "")];
}

function emptyPage(index: number): ArrestPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    body: [],
    showRights13: false,
    showRights4: false,
    showStatementLead: false,
    statement: null,
    showIncidentCert: false,
    signArresteeSlice: null,
    signOfficerSlice: null,
    showRecorder: false,
  };
}

export function addArrestSignSlot(list: string[]): string[] {
  return [...list, ""];
}

export function removeLastArrestSignSlot(list: string[]): string[] {
  return list.length <= ARREST_SIGN_MIN ? list : list.slice(0, -1);
}

function twoColRows(count: number): number {
  return Math.max(0, Math.ceil(count / 2));
}

export function packArrestRecordPages(
  fields: ArrestRecordFields,
  countLines: (text: string, indentCh: number) => number,
): ArrestPageModel[] {
  const pages: ArrestPageModel[] = [];
  let page = emptyPage(0);
  let used = ARREST_HEADER_MM;

  function remaining(): number {
    return ARREST_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = ARREST_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlowField(
    key: ArrestFlowFieldKey,
    label: string,
    text: string,
    minLines: number,
    target: "body" | "statement",
  ) {
    let rest = text;
    let first = true;
    let sliceIndex = 0;
    while (true) {
      if (target === "statement" && first) {
        need(ARREST_STATEMENT_LEAD_MM + ARREST_LINE_MM);
        if (!page.showStatementLead) {
          page.showStatementLead = true;
          used += ARREST_STATEMENT_LEAD_MM;
        }
      }
      const indentCh = first && label ? label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const wanted = Math.max(first ? minLines : 1, contentLines);
      const availLines = Math.floor(remaining() / ARREST_LINE_MM);
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
      const slice: ArrestPageBodySlice = {
        key,
        label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && label),
        sliceIndex,
      };
      if (target === "statement") page.statement = slice;
      else page.body.push(slice);
      used += takeLines * ARREST_LINE_MM + 0.4;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest) break;
      flush();
    }
  }

  for (const def of ARREST_BODY_FIELDS) {
    addFlowField(def.key, def.label, fields[def.key], def.minLines, "body");
  }

  need(ARREST_RIGHTS13_MM);
  page.showRights13 = true;
  used += ARREST_RIGHTS13_MM;
  if (page.index === 0) flush();

  need(ARREST_RIGHTS4_MM);
  page.showRights4 = true;
  used += ARREST_RIGHTS4_MM;

  addFlowField("statement", "", fields.statement, 3, "statement");

  need(ARREST_INCIDENT_CERT_MM);
  page.showIncidentCert = true;
  used += ARREST_INCIDENT_CERT_MM;

  function placeSignGroup(total: number, assign: (slice: ArrestSignSlice) => void) {
    let i = 0;
    while (i < total) {
      const availRows = Math.floor(remaining() / ARREST_SIGN_ROW_MM);
      if (availRows < 1) {
        flush();
        continue;
      }
      const left = total - i;
      const takePeople = Math.min(left, availRows * 2);
      assign({ start: i, count: takePeople });
      used += twoColRows(takePeople) * ARREST_SIGN_ROW_MM;
      i += takePeople;
      if (i < total) flush();
    }
  }

  const arresteeCount = Math.max(ARREST_SIGN_MIN, fields.signArrestees.length);
  const officerCount = Math.max(ARREST_SIGN_MIN, fields.signOfficers.length);

  placeSignGroup(arresteeCount, (slice) => {
    page.signArresteeSlice = slice;
  });
  if (remaining() < ARREST_SIGN_GROUP_GAP_MM + ARREST_SIGN_ROW_MM) flush();
  else used += ARREST_SIGN_GROUP_GAP_MM;
  placeSignGroup(officerCount, (slice) => {
    page.signOfficerSlice = slice;
  });
  need(ARREST_RECORDER_MM);
  page.showRecorder = true;
  used += ARREST_RECORDER_MM;

  pages.push(page);
  return pages;
}

export type ArrestRecordFields = {
  dailyLogItem: string;
  dailyLogTime: string;
  criminalCaseNo: string;
  exhibitAccountNo: string;
  recordPlace: string;
  recordDate: string;
  arrestDate: string;
  arrestPlace: string;
  arrestTambon: string;
  arrestAmphoe: string;
  arrestProvince: string;
  officers: string;
  arrestees: string;
  exhibits: string;
  exhibitFoundAt: string;
  charge: string;
  statement: string;
  incidentPlace: string;
  incidentDate: string;
  signArrestees: string[];
  signOfficers: string[];
  signRecorder: string;
};

export function createEmptyArrestRecordFields(): ArrestRecordFields {
  return {
    dailyLogItem: "",
    dailyLogTime: "",
    criminalCaseNo: "",
    exhibitAccountNo: "",
    recordPlace: "",
    recordDate: "",
    arrestDate: "",
    arrestPlace: "",
    arrestTambon: "",
    arrestAmphoe: "",
    arrestProvince: "",
    officers: "",
    arrestees: "",
    exhibits: "",
    exhibitFoundAt: "",
    charge: "",
    statement: "",
    incidentPlace: "",
    incidentDate: "",
    signArrestees: Array.from({ length: ARREST_SIGN_DEFAULT }, () => ""),
    signOfficers: Array.from({ length: ARREST_SIGN_DEFAULT }, () => ""),
    signRecorder: "",
  };
}

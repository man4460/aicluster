import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const INVESTIGATE_NOTICE_LINE_MM = 7.2;
export const INVESTIGATE_NOTICE_PAGE_INNER_MM = 273;
export const INVESTIGATE_NOTICE_HEADER_MM = 65.4;
export const INVESTIGATE_NOTICE_PAGE_NO_MM = 12;
export const INVESTIGATE_NOTICE_WHEN_MM = 12.3;
export const INVESTIGATE_NOTICE_CASE_MM = 16.6;
export const INVESTIGATE_NOTICE_CLOSE_MM = 20.8;
export const INVESTIGATE_NOTICE_SIGNS_MM = 29.4;

export const INVESTIGATE_NOTICE_DEFAULT_SUBJECT = "ให้สืบสวนหาตัวคนร้าย";
export const INVESTIGATE_NOTICE_DEFAULT_TO = "เจ้าหน้าที่ฝ่ายสืบสวน";
export const INVESTIGATE_NOTICE_CLOSE =
  "ฉะนั้น ให้ท่านออกสืบสวนหาตัวผู้กระทำความผิดในคดีนี้มาดำเนินคดีตามกฎหมายให้จงได้ และหากผลการสืบสวนปรากฏเป็นประการใด ให้รายงานผลการสืบสวนให้พนักงานสอบสวนทราบทุกระยะ ๑๕ วัน";

export const INVESTIGATE_NOTICE_FLOW_FIELDS = [
  { key: "incidentNotes" as const, label: "", minLines: 2 },
  { key: "scene" as const, label: "เหตุเกิด", minLines: 2 },
  { key: "charge" as const, label: "โดยกล่าวหาว่า", minLines: 1 },
] as const;

export type InvestigateNoticeFlowKey = (typeof INVESTIGATE_NOTICE_FLOW_FIELDS)[number]["key"];

export type InvestigateNoticePageSlice = {
  key: InvestigateNoticeFlowKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type InvestigateNoticePageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  showWhen: boolean;
  incidentNotes: InvestigateNoticePageSlice[];
  scene: InvestigateNoticePageSlice[];
  showCase: boolean;
  charge: InvestigateNoticePageSlice[];
  showClose: boolean;
  showSigns: boolean;
};

export type InvestigateNoticeFields = {
  agency: string;
  phone: string;
  docNo: string;
  docDate: string;
  subject: string;
  toName: string;
  whenDate: string;
  incidentNotes: string;
  scene: string;
  caseNo: string;
  complaintDate: string;
  pjwItem: string;
  time: string;
  charge: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
};

export function createEmptyInvestigateNoticeFields(): InvestigateNoticeFields {
  return {
    agency: "",
    phone: "",
    docNo: "",
    docDate: "",
    subject: INVESTIGATE_NOTICE_DEFAULT_SUBJECT,
    toName: INVESTIGATE_NOTICE_DEFAULT_TO,
    whenDate: "",
    incidentNotes: "",
    scene: "",
    caseNo: "",
    complaintDate: "",
    pjwItem: "",
    time: "",
    charge: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
  };
}

function emptyPage(index: number): InvestigateNoticePageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    showWhen: false,
    incidentNotes: [],
    scene: [],
    showCase: false,
    charge: [],
    showClose: false,
    showSigns: false,
  };
}

export function packInvestigateNoticePages(
  fields: InvestigateNoticeFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): InvestigateNoticePageModel[] {
  const pages: InvestigateNoticePageModel[] = [];
  let page = emptyPage(0);
  let used = INVESTIGATE_NOTICE_HEADER_MM;

  function remaining(): number {
    return INVESTIGATE_NOTICE_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = INVESTIGATE_NOTICE_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(def: (typeof INVESTIGATE_NOTICE_FLOW_FIELDS)[number]) {
    let rest = fields[def.key];
    let first = true;
    let sliceIndex = 0;
    let placed = 0;
    let hops = 0;
    while (hops++ < 400) {
      const indentCh = first && def.label ? def.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.floor(remaining() / INVESTIGATE_NOTICE_LINE_MM);
      if (availLines < 1) {
        flush();
        continue;
      }
      const stillNeed = Math.max(def.minLines - placed, contentLines, 1);
      const takeLines = Math.min(availLines, stillNeed);
      const [head, tail] =
        contentLines > takeLines
          ? splitArrestTextByLines(rest, takeLines, indentCh, countLines)
          : [rest, ""];
      if (!head && tail) {
        flush();
        continue;
      }
      const slice: InvestigateNoticePageSlice = {
        key: def.key,
        label: def.label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && def.label),
        sliceIndex,
      };
      if (def.key === "incidentNotes") page.incidentNotes.push(slice);
      else if (def.key === "scene") page.scene.push(slice);
      else page.charge.push(slice);
      used += takeLines * INVESTIGATE_NOTICE_LINE_MM + 0.4;
      placed += takeLines;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest && placed >= def.minLines) break;
      if (rest) flush();
    }
  }

  need(INVESTIGATE_NOTICE_WHEN_MM);
  page.showWhen = true;
  used += INVESTIGATE_NOTICE_WHEN_MM;
  addFlow(INVESTIGATE_NOTICE_FLOW_FIELDS[0]);
  addFlow(INVESTIGATE_NOTICE_FLOW_FIELDS[1]);
  need(INVESTIGATE_NOTICE_CASE_MM);
  page.showCase = true;
  used += INVESTIGATE_NOTICE_CASE_MM;
  addFlow(INVESTIGATE_NOTICE_FLOW_FIELDS[2]);
  need(INVESTIGATE_NOTICE_CLOSE_MM + INVESTIGATE_NOTICE_SIGNS_MM);
  page.showClose = true;
  page.showSigns = true;
  pages.push(page);
  return pages;
}

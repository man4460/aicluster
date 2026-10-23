import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const CASE_PROGRESS_LINE_MM = 7.2;
export const CASE_PROGRESS_PAGE_INNER_MM = 273;
export const CASE_PROGRESS_HEADER_MM = 36;
export const CASE_PROGRESS_MID_MM = 28;
export const CASE_PROGRESS_PAGE_NO_MM = 12;
export const CASE_PROGRESS_CLOSE_MM = 24;
export const CASE_PROGRESS_NOTES_MM = 50;

export const CASE_PROGRESS_FLOW_FIELDS = [
  {
    key: "charge" as const,
    label: "ตามที่ท่านได้แจ้งความร้องทุกข์หรือกล่าวโทษต่อพนักงานสอบสวนในความผิดฐาน",
    minLines: 3,
    target: "charge" as const,
  },
  {
    key: "result" as const,
    label: "๑. ผลการดำเนินการ",
    minLines: 6,
    target: "body" as const,
  },
  {
    key: "nextSteps" as const,
    label: "๒. สิ่งที่จะดำเนินการต่อไป",
    minLines: 5,
    target: "body" as const,
  },
  {
    key: "suggestion" as const,
    label: "๓. ข้อเสนอแนะ (ถ้ามี)",
    minLines: 4,
    target: "body" as const,
  },
] as const;

export type CaseProgressFlowFieldKey = (typeof CASE_PROGRESS_FLOW_FIELDS)[number]["key"];

export type CaseProgressPageSlice = {
  key: CaseProgressFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type CaseProgressPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  charge: CaseProgressPageSlice[];
  showMid: boolean;
  body: CaseProgressPageSlice[];
  showClose: boolean;
  showNotes: boolean;
};

export type CaseProgressFields = {
  docNo: string;
  place: string;
  day: string;
  month: string;
  year: string;
  toName: string;
  charge: string;
  caseNo: string;
  dailyLog: string;
  complaintDate: string;
  result: string;
  nextSteps: string;
  suggestion: string;
  signName: string;
  signPosition: string;
  contact1Rank: string;
  contact1Name: string;
  contact1Position: string;
  contact1Phone: string;
  contact1Mobile: string;
  contact2Rank: string;
  contact2Name: string;
  contact2Position: string;
  contact2Phone: string;
  contact2Mobile: string;
};

export function createEmptyCaseProgressFields(): CaseProgressFields {
  return {
    docNo: "",
    place: "",
    day: "",
    month: "",
    year: "",
    toName: "",
    charge: "",
    caseNo: "",
    dailyLog: "",
    complaintDate: "",
    result: "",
    nextSteps: "",
    suggestion: "",
    signName: "",
    signPosition: "",
    contact1Rank: "",
    contact1Name: "",
    contact1Position: "",
    contact1Phone: "",
    contact1Mobile: "",
    contact2Rank: "",
    contact2Name: "",
    contact2Position: "",
    contact2Phone: "",
    contact2Mobile: "",
  };
}

function emptyPage(index: number): CaseProgressPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    charge: [],
    showMid: false,
    body: [],
    showClose: false,
    showNotes: false,
  };
}

export function packCaseProgressPages(
  fields: CaseProgressFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): CaseProgressPageModel[] {
  const pages: CaseProgressPageModel[] = [];
  let page = emptyPage(0);
  let used = CASE_PROGRESS_HEADER_MM;

  function remaining(): number {
    return CASE_PROGRESS_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = CASE_PROGRESS_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(def: (typeof CASE_PROGRESS_FLOW_FIELDS)[number]) {
    let rest = fields[def.key];
    let first = true;
    let sliceIndex = 0;
    let placed = 0;
    let hops = 0;
    while (hops++ < 400) {
      const indentCh = first && def.label ? def.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.floor(remaining() / CASE_PROGRESS_LINE_MM);
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
      const slice: CaseProgressPageSlice = {
        key: def.key,
        label: def.label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && def.label),
        sliceIndex,
      };
      if (def.target === "charge") page.charge.push(slice);
      else page.body.push(slice);
      used += takeLines * CASE_PROGRESS_LINE_MM + 0.4;
      placed += takeLines;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest && placed >= def.minLines) break;
      if (rest) flush();
    }
  }

  for (const def of CASE_PROGRESS_FLOW_FIELDS) {
    addFlow(def);
    if (def.key === "charge") {
      need(CASE_PROGRESS_MID_MM);
      page.showMid = true;
      used += CASE_PROGRESS_MID_MM;
    }
  }

  need(CASE_PROGRESS_CLOSE_MM + CASE_PROGRESS_NOTES_MM);
  page.showClose = true;
  page.showNotes = true;
  used += CASE_PROGRESS_CLOSE_MM + CASE_PROGRESS_NOTES_MM;

  pages.push(page);
  return pages;
}

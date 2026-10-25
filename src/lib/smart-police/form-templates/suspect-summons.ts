import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const SUSPECT_SUMMONS_LINE_MM = 7.2;
export const SUSPECT_SUMMONS_PAGE_INNER_MM = 281;
export const SUSPECT_SUMMONS_HEADER_MM = 139;
export const SUSPECT_SUMMONS_PAGE_NO_MM = 12;
export const SUSPECT_SUMMONS_APPOINT_MM = 16;
export const SUSPECT_SUMMONS_TAIL_MM = 96;

export const SUSPECT_SUMMONS_AUTHORITY =
  "อาศัยอำนาจตามประมวลกฎหมายวิธีพิจารณาความอาญา พุทธศักราช ๒๔๗๗ มาตรา ๕๒";

export const SUSPECT_SUMMONS_WARNING =
  "หากท่านไม่มาตามหมายเรียก พนักงานสอบสวนจะขอให้ศาลออกหมายจับกุมตัวท่านมาดำเนินคดีตามกฎหมาย";

/** กล่องคำเตือนต้นฉบับตัดบรรทัดตายตัว 3 บรรทัด (ผู้ใช้แก้ข้อความเองไม่ได้) */
export const SUSPECT_SUMMONS_WARNING_LINES = [
  "หากท่านไม่มาตามหมายเรียก",
  "พนักงานสอบสวนจะขอให้ศาลออกหมาย",
  "จับกุมตัวท่านมาดำเนินคดีตามกฎหมาย",
] as const;

export const SUSPECT_SUMMONS_RECEIPT_TEXT = "ได้รับหมายเรียกของเจ้าพนักงานตำรวจ";

export const SUSPECT_SUMMONS_RECEIPT_TAIL = "ไว้แล้ว";

export const SUSPECT_SUMMONS_TAIL_NOTE =
  "*หมายเหตุ ในส่วนนี้ให้ผู้นำส่งหมาย นำกลับมาคืนแก่พนักงานสอบสวนผู้ออกหมาย";

export const SUSPECT_SUMMONS_FLOW_FIELDS = [
  { key: "reason" as const, label: "ด้วยเหตุที่ท่านต้องหาว่า", minLines: 2 },
  { key: "orderText" as const, label: "ฉะนั้นให้", minLines: 1 },
] as const;

export type SuspectSummonsFlowKey = (typeof SUSPECT_SUMMONS_FLOW_FIELDS)[number]["key"];

export type SuspectSummonsPageSlice = {
  key: SuspectSummonsFlowKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type SuspectSummonsPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  reason: SuspectSummonsPageSlice[];
  orderText: SuspectSummonsPageSlice[];
  showAppoint: boolean;
  showTail: boolean;
};

export type SuspectSummonsFields = {
  issueCount: string;
  issuePlace: string;
  issueDay: string;
  issueMonth: string;
  issueYear: string;
  caseNo: string;
  complainant: string;
  suspect: string;
  suspectName: string;
  houseNo: string;
  road: string;
  subDistrict: string;
  district: string;
  province: string;
  headman: string;
  kamnan: string;
  officerName: string;
  reason: string;
  orderText: string;
  placeToGo: string;
  appointDay: string;
  appointMonth: string;
  appointYear: string;
  appointTime: string;
  appointPlace2: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
  signPhone: string;
  receiptDay: string;
  receiptMonth: string;
  receiptYear: string;
  receiptTime: string;
  receiptPlace: string;
  appointDay2: string;
  appointMonth2: string;
  appointYear2: string;
  appointTime2: string;
  receiptName: string;
  receiptRelation: string;
  receiverName: string;
  delivererName: string;
};

export function createEmptySuspectSummonsFields(): SuspectSummonsFields {
  return {
    issueCount: "๑",
    issuePlace: "",
    issueDay: "",
    issueMonth: "",
    issueYear: "",
    caseNo: "",
    complainant: "",
    suspect: "",
    suspectName: "",
    houseNo: "",
    road: "",
    subDistrict: "",
    district: "",
    province: "",
    headman: "",
    kamnan: "",
    officerName: "",
    reason: "",
    orderText: "",
    placeToGo: "",
    appointDay: "",
    appointMonth: "",
    appointYear: "",
    appointTime: "",
    appointPlace2: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
    signPhone: "",
    receiptDay: "",
    receiptMonth: "",
    receiptYear: "",
    receiptTime: "",
    receiptPlace: "",
    appointDay2: "",
    appointMonth2: "",
    appointYear2: "",
    appointTime2: "",
    receiptName: "",
    receiptRelation: "",
    receiverName: "",
    delivererName: "",
  };
}

function emptyPage(index: number): SuspectSummonsPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    reason: [],
    orderText: [],
    showAppoint: false,
    showTail: false,
  };
}

export function packSuspectSummonsPages(
  fields: SuspectSummonsFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): SuspectSummonsPageModel[] {
  const pages: SuspectSummonsPageModel[] = [];
  let page = emptyPage(0);
  let used = SUSPECT_SUMMONS_HEADER_MM;

  function remaining(): number {
    return SUSPECT_SUMMONS_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = SUSPECT_SUMMONS_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(def: (typeof SUSPECT_SUMMONS_FLOW_FIELDS)[number]) {
    let rest = fields[def.key];
    let first = true;
    let sliceIndex = 0;
    let placed = 0;
    let hops = 0;
    while (hops++ < 400) {
      const indentCh = first && def.label ? def.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.floor(remaining() / SUSPECT_SUMMONS_LINE_MM);
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
      const slice: SuspectSummonsPageSlice = {
        key: def.key,
        label: def.label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && def.label),
        sliceIndex,
      };
      if (def.key === "reason") page.reason.push(slice);
      else page.orderText.push(slice);
      used += takeLines * SUSPECT_SUMMONS_LINE_MM + 0.4;
      placed += takeLines;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest && placed >= def.minLines) break;
      if (rest) flush();
    }
  }

  addFlow(SUSPECT_SUMMONS_FLOW_FIELDS[0]);
  addFlow(SUSPECT_SUMMONS_FLOW_FIELDS[1]);
  need(SUSPECT_SUMMONS_APPOINT_MM);
  page.showAppoint = true;
  used += SUSPECT_SUMMONS_APPOINT_MM;
  need(SUSPECT_SUMMONS_TAIL_MM);
  page.showTail = true;
  pages.push(page);
  return pages;
}

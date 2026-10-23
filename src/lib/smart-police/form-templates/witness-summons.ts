import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const WITNESS_SUMMONS_LINE_MM = 7.2;
export const WITNESS_SUMMONS_PAGE_INNER_MM = 275;
export const WITNESS_SUMMONS_HEADER_MM = 130;
export const WITNESS_SUMMONS_PAGE_NO_MM = 12;
export const WITNESS_SUMMONS_APPOINT_MM = 16;
export const WITNESS_SUMMONS_TAIL_MM = 106;

export const WITNESS_SUMMONS_AUTHORITY =
  "อาศัยอำนาจตามประมวลกฎหมายวิธีพิจารณาความอาญา พุทธศักราช ๒๔๗๗ มาตรา ๕๒";

export const WITNESS_SUMMONS_WARNING =
  "การขัดขืนหลีกเลี่ยงไม่มาตามหมายเรียกของพนักงานสอบสวน มีความผิดต้องระวางโทษจำคุกไม่เกินสามเดือน ปรับไม่เกินห้าพันบาท หรือทั้งจำทั้งปรับตามประมวลกฎหมายอาญามาตรา ๑๖๘";

export const WITNESS_SUMMONS_RECEIPT_TEXT =
  "ข้าพเจ้าได้รับหมายเรียกพยานของเจ้าพนักงานตำรวจ ซึ่งกำหนดให้ข้าพเจ้าไปยัง";

export const WITNESS_SUMMONS_RECEIPT_TAIL = "ไว้แล้ว";

export const WITNESS_SUMMONS_FLOW_FIELDS = [
  { key: "reason" as const, label: "ด้วยเหตุ", minLines: 2 },
  { key: "orderText" as const, label: "ฉะนั้นให้", minLines: 1 },
] as const;

export type WitnessSummonsFlowKey = (typeof WITNESS_SUMMONS_FLOW_FIELDS)[number]["key"];

export type WitnessSummonsPageSlice = {
  key: WitnessSummonsFlowKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type WitnessSummonsPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  reason: WitnessSummonsPageSlice[];
  orderText: WitnessSummonsPageSlice[];
  showAppoint: boolean;
  showTail: boolean;
};

export type WitnessSummonsFields = {
  issuePlace: string;
  issueDay: string;
  issueMonth: string;
  issueYear: string;
  caseNo: string;
  complainant: string;
  suspect: string;
  witnessName: string;
  houseNo: string;
  road: string;
  subDistrict: string;
  district: string;
  province: string;
  headman: string;
  reason: string;
  orderText: string;
  placeToGo: string;
  appointDay: string;
  appointMonth: string;
  appointYear: string;
  appointTime: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
  receiptDay: string;
  receiptMonth: string;
  receiptYear: string;
  receiptTime: string;
  receiptPlace: string;
  appointDay2: string;
  appointMonth2: string;
  appointYear2: string;
  appointTime2: string;
  receiverName: string;
  delivererName: string;
};

export function createEmptyWitnessSummonsFields(): WitnessSummonsFields {
  return {
    issuePlace: "",
    issueDay: "",
    issueMonth: "",
    issueYear: "",
    caseNo: "",
    complainant: "",
    suspect: "",
    witnessName: "",
    houseNo: "",
    road: "",
    subDistrict: "",
    district: "",
    province: "",
    headman: "",
    reason: "",
    orderText: "",
    placeToGo: "",
    appointDay: "",
    appointMonth: "",
    appointYear: "",
    appointTime: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
    receiptDay: "",
    receiptMonth: "",
    receiptYear: "",
    receiptTime: "",
    receiptPlace: "",
    appointDay2: "",
    appointMonth2: "",
    appointYear2: "",
    appointTime2: "",
    receiverName: "",
    delivererName: "",
  };
}

function emptyPage(index: number): WitnessSummonsPageModel {
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

export function packWitnessSummonsPages(
  fields: WitnessSummonsFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): WitnessSummonsPageModel[] {
  const pages: WitnessSummonsPageModel[] = [];
  let page = emptyPage(0);
  let used = WITNESS_SUMMONS_HEADER_MM;

  function remaining(): number {
    return WITNESS_SUMMONS_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = WITNESS_SUMMONS_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(def: (typeof WITNESS_SUMMONS_FLOW_FIELDS)[number]) {
    let rest = fields[def.key];
    let first = true;
    let sliceIndex = 0;
    let placed = 0;
    let hops = 0;
    while (hops++ < 400) {
      const indentCh = first && def.label ? def.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.floor(remaining() / WITNESS_SUMMONS_LINE_MM);
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
      const slice: WitnessSummonsPageSlice = {
        key: def.key,
        label: def.label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && def.label),
        sliceIndex,
      };
      if (def.key === "reason") page.reason.push(slice);
      else page.orderText.push(slice);
      used += takeLines * WITNESS_SUMMONS_LINE_MM + 0.4;
      placed += takeLines;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest && placed >= def.minLines) break;
      if (rest) flush();
    }
  }

  addFlow(WITNESS_SUMMONS_FLOW_FIELDS[0]);
  addFlow(WITNESS_SUMMONS_FLOW_FIELDS[1]);
  need(WITNESS_SUMMONS_APPOINT_MM);
  page.showAppoint = true;
  used += WITNESS_SUMMONS_APPOINT_MM;
  need(WITNESS_SUMMONS_TAIL_MM);
  page.showTail = true;
  pages.push(page);
  return pages;
}

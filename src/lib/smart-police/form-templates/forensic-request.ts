import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

export const FORENSIC_REQUEST_LINE_MM = 7.2;
export const FORENSIC_REQUEST_PAGE_INNER_MM = 273;
export const FORENSIC_REQUEST_HEADER_MM = 67.2;
export const FORENSIC_REQUEST_PAGE_NO_MM = 12;
export const FORENSIC_REQUEST_ITEM1_MM = 16.6;
export const FORENSIC_REQUEST_ITEM4_MM = 8.5;
export const FORENSIC_REQUEST_HEADING_MM = 7.5;
export const FORENSIC_REQUEST_SIGNS_MM = 29.4;
export const FORENSIC_REQUEST_LIST_MIN = 1;
export const FORENSIC_REQUEST_LIST_DEFAULT = 3;

export const FORENSIC_REQUEST_INTRO = "พนักงานสอบสวนขอส่งของกลางมาเพื่อให้ตรวจพิสูจน์ดังนี้";
export const FORENSIC_REQUEST_EXHIBIT_HEADING = "(๘) รายการของกลางที่ส่งมาตรวจ";
export const FORENSIC_REQUEST_PURPOSE_HEADING = "(๙) จุดประสงค์ในการตรวจพิสูจน์";

export const FORENSIC_REQUEST_FLOW_FIELDS = [
  { key: "incidentDate" as const, label: "(๒) วัน เดือน ปี ที่เกิดเหตุ", minLines: 1, indentMm: 0 },
  { key: "scenePlace" as const, label: "(๓) สถานที่เกิดเหตุ", minLines: 1, indentMm: 0 },
  { key: "charge" as const, label: "(๕) ข้อกล่าวหา", minLines: 1, indentMm: 0 },
  { key: "facts" as const, label: "(๖) พฤติการณ์และข้อเท็จจริงที่เกิดขึ้น", minLines: 4, indentMm: 0 },
  { key: "exhibitPlace" as const, label: "(๗) สถานที่พบของกลาง", minLines: 1, indentMm: 0 },
  { key: "investigator" as const, label: "(๑๐) ชื่อพนักงานสอบสวน", minLines: 1, indentMm: 0 },
] as const;

export type ForensicRequestFlowKey =
  | (typeof FORENSIC_REQUEST_FLOW_FIELDS)[number]["key"]
  | "exhibit"
  | "purpose";

export type ForensicRequestPageSlice = {
  key: ForensicRequestFlowKey;
  itemIndex: number;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  indentMm: number;
  heading: string;
  showHeading: boolean;
  sliceIndex: number;
};

export type ForensicRequestPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  showItem1: boolean;
  showItem4: boolean;
  slices: ForensicRequestPageSlice[];
  showSigns: boolean;
};

export type ForensicRequestFields = {
  agency: string;
  phone: string;
  docNo: string;
  docDate: string;
  subject: string;
  toName: string;
  caseNo: string;
  suspectName: string;
  suspectAge: string;
  suspectNationality: string;
  incidentDate: string;
  scenePlace: string;
  complainantName: string;
  complainantAge: string;
  complainantNationality: string;
  charge: string;
  facts: string;
  exhibitPlace: string;
  exhibits: string[];
  purposes: string[];
  investigator: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
};

export function createEmptyForensicRequestFields(): ForensicRequestFields {
  return {
    agency: "",
    phone: "",
    docNo: "",
    docDate: "",
    subject: "",
    toName: "",
    caseNo: "",
    suspectName: "",
    suspectAge: "",
    suspectNationality: "",
    incidentDate: "",
    scenePlace: "",
    complainantName: "",
    complainantAge: "",
    complainantNationality: "",
    charge: "",
    facts: "",
    exhibitPlace: "",
    exhibits: Array.from({ length: FORENSIC_REQUEST_LIST_DEFAULT }, () => ""),
    purposes: Array.from({ length: FORENSIC_REQUEST_LIST_DEFAULT }, () => ""),
    investigator: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
  };
}

export function addForensicRequestListItem(list: string[]): string[] {
  return [...list, ""];
}

export function removeLastForensicRequestListItem(list: string[]): string[] {
  return list.length <= FORENSIC_REQUEST_LIST_MIN ? list : list.slice(0, -1);
}

function emptyPage(index: number): ForensicRequestPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    showItem1: false,
    showItem4: false,
    slices: [],
    showSigns: false,
  };
}

export function packForensicRequestPages(
  fields: ForensicRequestFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): ForensicRequestPageModel[] {
  const pages: ForensicRequestPageModel[] = [];
  let page = emptyPage(0);
  let used = FORENSIC_REQUEST_HEADER_MM;

  function remaining(): number {
    return FORENSIC_REQUEST_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = FORENSIC_REQUEST_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(opts: {
    key: ForensicRequestFlowKey;
    itemIndex: number;
    label: string;
    text: string;
    minLines: number;
    indentMm: number;
    heading: string;
  }) {
    let rest = opts.text;
    let first = true;
    let sliceIndex = 0;
    let hops = 0;
    while (hops++ < 400) {
      const headingMm = first && opts.heading ? FORENSIC_REQUEST_HEADING_MM : 0;
      if (remaining() < headingMm + FORENSIC_REQUEST_LINE_MM) {
        flush();
        continue;
      }
      used += headingMm;
      const indentCh = first && opts.label ? opts.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.max(1, Math.floor(remaining() / FORENSIC_REQUEST_LINE_MM));
      const fill = !rest && first ? Math.min(opts.minLines, availLines) : 0;
      const takeLines = Math.min(availLines, Math.max(contentLines, fill, 1));
      const [head, tail] =
        contentLines > takeLines
          ? splitArrestTextByLines(rest, takeLines, indentCh, countLines)
          : [rest, ""];
      if (!head && tail) {
        flush();
        continue;
      }
      page.slices.push({
        key: opts.key,
        itemIndex: opts.itemIndex,
        label: opts.label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && opts.label),
        indentMm: opts.indentMm,
        heading: first ? opts.heading : "",
        showHeading: Boolean(first && opts.heading),
        sliceIndex,
      });
      used += takeLines * FORENSIC_REQUEST_LINE_MM + 0.4;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest) break;
      flush();
    }
  }

  need(FORENSIC_REQUEST_ITEM1_MM);
  page.showItem1 = true;
  used += FORENSIC_REQUEST_ITEM1_MM;

  const exhibits = fields.exhibits.length ? fields.exhibits : [""];
  const purposes = fields.purposes.length ? fields.purposes : [""];

  for (const def of FORENSIC_REQUEST_FLOW_FIELDS) {
    if (def.key === "charge") {
      need(FORENSIC_REQUEST_ITEM4_MM);
      page.showItem4 = true;
      used += FORENSIC_REQUEST_ITEM4_MM;
    }
    if (def.key === "investigator") {
      exhibits.forEach((text, i) => {
        addFlow({
          key: "exhibit",
          itemIndex: i,
          label: `(๘.${thaiNumeral(i + 1)})`,
          text,
          minLines: 1,
          indentMm: 10,
          heading: i === 0 ? FORENSIC_REQUEST_EXHIBIT_HEADING : "",
        });
      });
      purposes.forEach((text, i) => {
        addFlow({
          key: "purpose",
          itemIndex: i,
          label: `(๙.${thaiNumeral(i + 1)})`,
          text,
          minLines: 1,
          indentMm: 10,
          heading: i === 0 ? FORENSIC_REQUEST_PURPOSE_HEADING : "",
        });
      });
    }
    addFlow({
      key: def.key,
      itemIndex: 0,
      label: def.label,
      text: fields[def.key],
      minLines: def.minLines,
      indentMm: def.indentMm,
      heading: "",
    });
  }

  need(FORENSIC_REQUEST_SIGNS_MM);
  page.showSigns = true;
  pages.push(page);
  return pages;
}

import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const SCENE_INSPECT_LINE_MM = 7.2;
export const SCENE_INSPECT_PAGE_INNER_MM = 273;
export const SCENE_INSPECT_HEADER_MM = 118;
export const SCENE_INSPECT_PAGE_NO_MM = 12;
export const SCENE_INSPECT_SIGNS_MM = 31.9;

export const SCENE_INSPECT_FLOW_FIELDS = [
  {
    key: "condition" as const,
    heading: "ข้อ ๙ สภาพทั่วไป และร่องรอยหลักฐานที่พบในสถานที่เกิดเหตุ",
    label: "",
    headingMm: 7,
    minLines: 6,
  },
  {
    key: "summary" as const,
    heading: "ข้อ ๑๐ เหตุการณ์ที่เกิดขึ้นโดยสังเขป",
    label: "",
    headingMm: 7,
    minLines: 22,
  },
  {
    key: "damage" as const,
    heading: "ข้อ ๑๑ ความเสียหายต่อชีวิต ร่างกายหรือทรัพย์สิน ที่เกิดขึ้น",
    label: "๑๑.๑",
    headingMm: 8,
    minLines: 5,
  },
  {
    key: "seized" as const,
    heading:
      "ข้อ ๑๒ สิ่งของที่ยึดได้จากที่เกิดเหตุ (อธิบายให้ชัดเจนว่า สิ่งของชิ้นใด ยึดมาจากที่ใด แยกเป็นข้อย่อยแต่ละชิ้นเพื่อมิให้สับสน)",
    label: "",
    headingMm: 14,
    minLines: 6,
  },
  {
    key: "presumption" as const,
    heading: "ข้อ ๑๓ ข้อสันนิษฐานเบื้องต้น",
    label: "",
    headingMm: 7,
    minLines: 5,
  },
] as const;

export type SceneInspectFlowFieldKey = (typeof SCENE_INSPECT_FLOW_FIELDS)[number]["key"];

export type SceneInspectPageSlice = {
  key: SceneInspectFlowFieldKey;
  heading: string;
  showHeading: boolean;
  label: string;
  showLabel: boolean;
  text: string;
  lines: number;
  sliceIndex: number;
};

export type SceneInspectPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  slices: SceneInspectPageSlice[];
  showSigns: boolean;
};

export type SceneInspectFields = {
  recordPlace: string;
  day: string;
  month: string;
  year: string;
  inspector: string;
  inspectorPosition: string;
  complainant: string;
  suspect: string;
  charge: string;
  incidentDay: string;
  incidentMonth: string;
  incidentYear: string;
  incidentTime: string;
  reportDay: string;
  reportMonth: string;
  reportYear: string;
  reportTime: string;
  dailyLogItem: string;
  inspectDay: string;
  inspectMonth: string;
  inspectYear: string;
  inspectFrom: string;
  inspectTo: string;
  place: string;
  moo: string;
  alley: string;
  road: string;
  subdistrict: string;
  district: string;
  province: string;
  condition: string;
  summary: string;
  damage: string;
  seized: string;
  presumption: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
};

export function createEmptySceneInspectFields(): SceneInspectFields {
  return {
    recordPlace: "",
    day: "",
    month: "",
    year: "",
    inspector: "",
    inspectorPosition: "",
    complainant: "",
    suspect: "",
    charge: "",
    incidentDay: "",
    incidentMonth: "",
    incidentYear: "",
    incidentTime: "",
    reportDay: "",
    reportMonth: "",
    reportYear: "",
    reportTime: "",
    dailyLogItem: "",
    inspectDay: "",
    inspectMonth: "",
    inspectYear: "",
    inspectFrom: "",
    inspectTo: "",
    place: "",
    moo: "",
    alley: "",
    road: "",
    subdistrict: "",
    district: "",
    province: "",
    condition: "",
    summary: "",
    damage: "",
    seized: "",
    presumption: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
  };
}

function emptyPage(index: number): SceneInspectPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    slices: [],
    showSigns: false,
  };
}

export function packSceneInspectPages(
  fields: SceneInspectFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): SceneInspectPageModel[] {
  const pages: SceneInspectPageModel[] = [];
  let page = emptyPage(0);
  let used = SCENE_INSPECT_HEADER_MM;

  function remaining(): number {
    return SCENE_INSPECT_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = SCENE_INSPECT_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlow(def: (typeof SCENE_INSPECT_FLOW_FIELDS)[number]) {
    let rest = fields[def.key];
    let first = true;
    let sliceIndex = 0;
    let placed = 0;
    while (true) {
      const headingMm = first ? def.headingMm : 0;
      if (remaining() < headingMm + SCENE_INSPECT_LINE_MM) {
        flush();
        continue;
      }
      used += headingMm;
      const indentCh = first && def.label ? def.label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const availLines = Math.floor(remaining() / SCENE_INSPECT_LINE_MM);
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
      page.slices.push({
        key: def.key,
        heading: def.heading,
        showHeading: first,
        label: def.label,
        showLabel: Boolean(first && def.label),
        text: head,
        lines: takeLines,
        sliceIndex,
      });
      used += takeLines * SCENE_INSPECT_LINE_MM + 0.4;
      placed += takeLines;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (rest) {
        flush();
        continue;
      }
      if (placed >= def.minLines) break;
      flush();
    }
  }

  addFlow(SCENE_INSPECT_FLOW_FIELDS[0]);
  addFlow(SCENE_INSPECT_FLOW_FIELDS[1]);
  if (page.index === 0) flush();
  addFlow(SCENE_INSPECT_FLOW_FIELDS[2]);
  addFlow(SCENE_INSPECT_FLOW_FIELDS[3]);
  addFlow(SCENE_INSPECT_FLOW_FIELDS[4]);

  need(SCENE_INSPECT_SIGNS_MM);
  page.showSigns = true;
  pages.push(page);
  return pages;
}

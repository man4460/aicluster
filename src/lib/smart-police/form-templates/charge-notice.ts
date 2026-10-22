import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const CHARGE_NOTICE_LINE_MM = 6.2;
export const CHARGE_NOTICE_PAGE_INNER_MM = 273;
export const CHARGE_NOTICE_HEADER_MM = 92;
export const CHARGE_NOTICE_PAGE_NO_MM = 12;
export const CHARGE_NOTICE_RIGHTS_MM = 22;
export const CHARGE_NOTICE_CLOSING_MM = 28;
export const CHARGE_NOTICE_SIGNS_MM = 40;

export const CHARGE_NOTICE_APPEARANCES = [
  { id: "summoned", label: "ถูกเรียกมาพบ" },
  { id: "sent", label: "ส่งตัวมาพบ" },
  { id: "came", label: "เข้าหา" },
  { id: "present", label: "มาอยู่ต่อหน้า" },
] as const;

export type ChargeNoticeAppearance = (typeof CHARGE_NOTICE_APPEARANCES)[number]["id"] | "";

export const CHARGE_NOTICE_BODY_FIELDS = [
  { key: "chargeNotice", label: "จึงได้แจ้งข้อกล่าวหาให้ทราบว่า", minLines: 4 },
  { key: "conduct", label: "พฤติการณ์และการกระทำของผู้ต้องหาเป็นความผิดฐาน", minLines: 3 },
] as const;

export const CHARGE_NOTICE_PLEA_FIELD = {
  key: "plea" as const,
  label: "ผู้ต้องหารับทราบข้อกล่าวหา และเข้าใจดีโดยตลอดแล้ว ได้ให้การ",
  minLines: 2,
};

export type ChargeNoticeFlowFieldKey =
  | (typeof CHARGE_NOTICE_BODY_FIELDS)[number]["key"]
  | typeof CHARGE_NOTICE_PLEA_FIELD.key;

export type ChargeNoticePageBodySlice = {
  key: ChargeNoticeFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type ChargeNoticePageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  body: ChargeNoticePageBodySlice[];
  showRights: boolean;
  plea: ChargeNoticePageBodySlice | null;
  showClosing: boolean;
  showSigns: boolean;
};

export type ChargeNoticeFields = {
  docNo: string;
  day: string;
  month: string;
  year: string;
  today: string;
  time: string;
  dailyLogItem: string;
  name: string;
  age: string;
  ethnicity: string;
  nationality: string;
  address: string;
  moo: string;
  road: string;
  tambon: string;
  amphoe: string;
  province: string;
  phone: string;
  caseRef: string;
  appearance: ChargeNoticeAppearance;
  investigator: string;
  investigatorRank: string;
  chargeNotice: string;
  conduct: string;
  plea: string;
  signAccused: string;
  signWitness: string;
  signRecorder: string;
  recorderPosition: string;
  signCopyAccused: string;
};

export function createEmptyChargeNoticeFields(): ChargeNoticeFields {
  return {
    docNo: "",
    day: "",
    month: "",
    year: "",
    today: "",
    time: "",
    dailyLogItem: "",
    name: "",
    age: "",
    ethnicity: "",
    nationality: "",
    address: "",
    moo: "",
    road: "",
    tambon: "",
    amphoe: "",
    province: "",
    phone: "",
    caseRef: "",
    appearance: "",
    investigator: "",
    investigatorRank: "",
    chargeNotice: "",
    conduct: "",
    plea: "",
    signAccused: "",
    signWitness: "",
    signRecorder: "",
    recorderPosition: "",
    signCopyAccused: "",
  };
}

function emptyPage(index: number): ChargeNoticePageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    body: [],
    showRights: false,
    plea: null,
    showClosing: false,
    showSigns: false,
  };
}

export function packChargeNoticePages(
  fields: ChargeNoticeFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): ChargeNoticePageModel[] {
  const pages: ChargeNoticePageModel[] = [];
  let page = emptyPage(0);
  let used = CHARGE_NOTICE_HEADER_MM;

  function remaining(): number {
    return CHARGE_NOTICE_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = CHARGE_NOTICE_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlowField(
    key: ChargeNoticeFlowFieldKey,
    label: string,
    text: string,
    minLines: number,
    target: "body" | "plea",
  ) {
    let rest = text;
    let first = true;
    let sliceIndex = 0;
    while (true) {
      const indentCh = first && label ? label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const wanted = Math.max(first ? minLines : 1, contentLines);
      const availLines = Math.floor(remaining() / CHARGE_NOTICE_LINE_MM);
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
      const slice: ChargeNoticePageBodySlice = {
        key,
        label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && label),
        sliceIndex,
      };
      if (target === "plea") page.plea = slice;
      else page.body.push(slice);
      used += takeLines * CHARGE_NOTICE_LINE_MM + 0.4;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest) break;
      flush();
    }
  }

  for (const def of CHARGE_NOTICE_BODY_FIELDS) {
    addFlowField(def.key, def.label, fields[def.key], def.minLines, "body");
  }

  need(CHARGE_NOTICE_RIGHTS_MM);
  page.showRights = true;
  used += CHARGE_NOTICE_RIGHTS_MM;

  addFlowField(
    CHARGE_NOTICE_PLEA_FIELD.key,
    CHARGE_NOTICE_PLEA_FIELD.label,
    fields.plea,
    CHARGE_NOTICE_PLEA_FIELD.minLines,
    "plea",
  );

  need(CHARGE_NOTICE_CLOSING_MM + CHARGE_NOTICE_SIGNS_MM);
  page.showClosing = true;
  page.showSigns = true;
  used += CHARGE_NOTICE_CLOSING_MM + CHARGE_NOTICE_SIGNS_MM;

  pages.push(page);
  return pages;
}

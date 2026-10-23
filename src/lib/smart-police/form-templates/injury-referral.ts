import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const INJURY_REFERRAL_LINE_MM = 7.2;
export const INJURY_REFERRAL_PAGE_INNER_MM = 273;
export const INJURY_REFERRAL_HEADER_MM = 92;
export const INJURY_REFERRAL_DOCTOR_HEADER_MM = 50;
export const INJURY_REFERRAL_PAGE_NO_MM = 12;
export const INJURY_REFERRAL_SIGNS_MM = 26;
export const INJURY_REFERRAL_HEADING_MM = 8;

export const INJURY_REFERRAL_CAUSE_LABEL = "เหตุที่ต้องบาดเจ็บหรือตายด้วยประการใดโดยย่อ กล่าวคือ .-";
export const INJURY_REFERRAL_FINDINGS_LABEL = "รายการที่แพทย์ได้ตรวจและความเห็น";

export type InjuryReferralFlowKey = "cause" | "findings";
export type InjuryReferralPageKind = "referral" | "doctor";

export type InjuryReferralPageSlice = {
  key: InjuryReferralFlowKey;
  label: string;
  text: string;
  lines: number;
  showHeading: boolean;
  sliceIndex: number;
};

export type InjuryReferralPageModel = {
  index: number;
  kind: InjuryReferralPageKind;
  showHeader: boolean;
  showPageNo: boolean;
  slices: InjuryReferralPageSlice[];
  showSigns: boolean;
};

export type InjuryReferralFields = {
  caseNo: string;
  station: string;
  day: string;
  month: string;
  year: string;
  docNo: string;
  injuryName: string;
  incidentWhen: string;
  sentWhen: string;
  senderName: string;
  cause: string;
  signName: string;
  signPrinted: string;
  signPosition: string;
  doctorTambon: string;
  receivedDay: string;
  receivedMonth: string;
  receivedYear: string;
  receivedTime: string;
  findings: string;
  doctorSignName: string;
  doctorSignPrinted: string;
};

export function createEmptyInjuryReferralFields(): InjuryReferralFields {
  return {
    caseNo: "",
    station: "",
    day: "",
    month: "",
    year: "",
    docNo: "",
    injuryName: "",
    incidentWhen: "",
    sentWhen: "",
    senderName: "",
    cause: "",
    signName: "",
    signPrinted: "",
    signPosition: "",
    doctorTambon: "",
    receivedDay: "",
    receivedMonth: "",
    receivedYear: "",
    receivedTime: "",
    findings: "",
    doctorSignName: "",
    doctorSignPrinted: "",
  };
}

function emptyPage(index: number, kind: InjuryReferralPageKind): InjuryReferralPageModel {
  return {
    index,
    kind,
    showHeader: true,
    showPageNo: false,
    slices: [],
    showSigns: false,
  };
}

export function packInjuryReferralPages(
  fields: InjuryReferralFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): InjuryReferralPageModel[] {
  const pages: InjuryReferralPageModel[] = [];
  let page = emptyPage(0, "referral");
  let used = INJURY_REFERRAL_HEADER_MM;

  function remaining(): number {
    return INJURY_REFERRAL_PAGE_INNER_MM - used;
  }

  function flush(nextKind: InjuryReferralPageKind) {
    pages.push(page);
    page = emptyPage(pages.length, nextKind);
    const cont = pages.some((p) => p.kind === nextKind);
    page.showHeader = !cont;
    page.showPageNo = cont;
    used = page.showHeader
      ? nextKind === "referral"
        ? INJURY_REFERRAL_HEADER_MM
        : INJURY_REFERRAL_DOCTOR_HEADER_MM
      : INJURY_REFERRAL_PAGE_NO_MM;
  }

  function need(mm: number, kind: InjuryReferralPageKind) {
    if (remaining() >= mm - 0.2) return;
    flush(kind);
  }

  function addFlow(
    key: InjuryReferralFlowKey,
    label: string,
    text: string,
    kind: InjuryReferralPageKind,
  ) {
    let rest = text;
    let first = true;
    let sliceIndex = 0;
    let hops = 0;
    while (hops++ < 400) {
      const headingMm = first ? INJURY_REFERRAL_HEADING_MM : 0;
      if (remaining() < headingMm + INJURY_REFERRAL_LINE_MM + INJURY_REFERRAL_SIGNS_MM) {
        flush(kind);
        continue;
      }
      used += headingMm;
      const contentLines = countLines(rest, 0);
      const availLines = Math.max(
        1,
        Math.floor((remaining() - INJURY_REFERRAL_SIGNS_MM) / INJURY_REFERRAL_LINE_MM),
      );
      const takeLines = contentLines > availLines ? availLines : first ? availLines : Math.max(contentLines, 1);
      const [head, tail] =
        contentLines > takeLines
          ? splitArrestTextByLines(rest, takeLines, 0, countLines)
          : [rest, ""];
      if (!head && tail) {
        flush(kind);
        continue;
      }
      page.slices.push({
        key,
        label,
        text: head,
        lines: takeLines,
        showHeading: first,
        sliceIndex,
      });
      used += takeLines * INJURY_REFERRAL_LINE_MM + 0.4;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest) break;
      flush(kind);
    }
  }

  addFlow("cause", INJURY_REFERRAL_CAUSE_LABEL, fields.cause, "referral");
  need(INJURY_REFERRAL_SIGNS_MM, "referral");
  page.showSigns = true;
  used += INJURY_REFERRAL_SIGNS_MM;
  flush("doctor");

  addFlow("findings", INJURY_REFERRAL_FINDINGS_LABEL, fields.findings, "doctor");
  need(INJURY_REFERRAL_SIGNS_MM, "doctor");
  page.showSigns = true;
  pages.push(page);
  return pages;
}

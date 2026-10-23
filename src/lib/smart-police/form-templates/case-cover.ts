import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const CASE_COVER_LINE_MM = 7.2;
export const CASE_COVER_PAGE_INNER_MM = 273;
export const CASE_COVER_HEADER_MM = 56;
export const CASE_COVER_PAGE_NO_MM = 12;
export const CASE_COVER_META_CONTROL_MM = 58;
export const CASE_COVER_APPT_SEND_MM = 60;

export const CASE_COVER_PARTY_FIELDS = [
  { key: "charge", label: "ต้องหาว่ากระทำความผิดฐาน", minLines: 2 },
  { key: "victim", label: "ผู้เสียหาย", minLines: 1 },
  { key: "suspect", label: "ผู้ต้องหา", minLines: 1 },
] as const;

export const CASE_COVER_WITNESS_FIELDS = [
  { key: "witness1", label: "๑.", minLines: 2 },
  { key: "witness2", label: "๒.", minLines: 2 },
  { key: "witness3", label: "๓.", minLines: 2 },
] as const;

export const CASE_COVER_NOTES_FIELD = {
  key: "notes" as const,
  label: "หมายเหตุ",
  minLines: 3,
};

export type CaseCoverFlowFieldKey =
  | (typeof CASE_COVER_PARTY_FIELDS)[number]["key"]
  | (typeof CASE_COVER_WITNESS_FIELDS)[number]["key"]
  | typeof CASE_COVER_NOTES_FIELD.key;

export type CaseCoverPageBodySlice = {
  key: CaseCoverFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type CaseCoverPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  parties: CaseCoverPageBodySlice[];
  showMetaControl: boolean;
  witnesses: CaseCoverPageBodySlice[];
  showWitnessLead: boolean;
  showApptSend: boolean;
  notes: CaseCoverPageBodySlice | null;
};

export type CaseCoverFields = {
  caseNo: string;
  station: string;
  charge: string;
  victim: string;
  suspect: string;
  reportDate: string;
  exhibitNo: string;
  investigator: string;
  bailFrom: string;
  custodyFrom: string;
  custodyUntil: string;
  courtFrom: string;
  courtUntil: string;
  witness1: string;
  witness2: string;
  witness3: string;
  appt1Date: string;
  appt1Witness: string;
  appt1Investigator: string;
  appt2Date: string;
  appt2Witness: string;
  appt2Investigator: string;
  appt3Date: string;
  appt3Witness: string;
  appt3Investigator: string;
  sentTo: string;
  reportNo: string;
  sentDate: string;
  notes: string;
};

export function createEmptyCaseCoverFields(): CaseCoverFields {
  return {
    caseNo: "",
    station: "",
    charge: "",
    victim: "",
    suspect: "",
    reportDate: "",
    exhibitNo: "",
    investigator: "",
    bailFrom: "",
    custodyFrom: "",
    custodyUntil: "",
    courtFrom: "",
    courtUntil: "",
    witness1: "",
    witness2: "",
    witness3: "",
    appt1Date: "",
    appt1Witness: "",
    appt1Investigator: "",
    appt2Date: "",
    appt2Witness: "",
    appt2Investigator: "",
    appt3Date: "",
    appt3Witness: "",
    appt3Investigator: "",
    sentTo: "",
    reportNo: "",
    sentDate: "",
    notes: "",
  };
}

function emptyPage(index: number): CaseCoverPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    parties: [],
    showMetaControl: false,
    witnesses: [],
    showWitnessLead: false,
    showApptSend: false,
    notes: null,
  };
}

export function packCaseCoverPages(
  fields: CaseCoverFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): CaseCoverPageModel[] {
  const pages: CaseCoverPageModel[] = [];
  let page = emptyPage(0);
  let used = CASE_COVER_HEADER_MM;

  function remaining(): number {
    return CASE_COVER_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = CASE_COVER_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  function addFlowField(
    key: CaseCoverFlowFieldKey,
    label: string,
    text: string,
    minLines: number,
    target: "parties" | "witnesses" | "notes",
  ) {
    let rest = text;
    let first = true;
    let sliceIndex = 0;
    while (true) {
      const indentCh = first && label ? label.length + 1 : 0;
      const contentLines = countLines(rest, indentCh);
      const wanted = Math.max(first ? minLines : 1, contentLines);
      const availLines = Math.floor(remaining() / CASE_COVER_LINE_MM);
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
      const slice: CaseCoverPageBodySlice = {
        key,
        label,
        text: head,
        lines: takeLines,
        showLabel: Boolean(first && label),
        sliceIndex,
      };
      if (target === "parties") page.parties.push(slice);
      else if (target === "witnesses") {
        if (first && key === "witness1" && page.index === 0) page.showWitnessLead = true;
        page.witnesses.push(slice);
      } else page.notes = slice;
      used += takeLines * CASE_COVER_LINE_MM + 0.4;
      rest = tail;
      first = false;
      sliceIndex += 1;
      if (!rest) break;
      flush();
    }
  }

  for (const def of CASE_COVER_PARTY_FIELDS) {
    addFlowField(def.key, def.label, fields[def.key], def.minLines, "parties");
  }

  need(CASE_COVER_META_CONTROL_MM);
  page.showMetaControl = true;
  used += CASE_COVER_META_CONTROL_MM;

  for (const def of CASE_COVER_WITNESS_FIELDS) {
    addFlowField(def.key, def.label, fields[def.key], def.minLines, "witnesses");
  }

  need(CASE_COVER_APPT_SEND_MM);
  page.showApptSend = true;
  used += CASE_COVER_APPT_SEND_MM;

  addFlowField(
    CASE_COVER_NOTES_FIELD.key,
    CASE_COVER_NOTES_FIELD.label,
    fields.notes,
    CASE_COVER_NOTES_FIELD.minLines,
    "notes",
  );

  pages.push(page);
  return pages;
}

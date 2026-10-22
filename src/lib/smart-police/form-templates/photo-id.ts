import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const PHOTO_ID_LINE_MM = 6.2;
export const PHOTO_ID_PAGE_INNER_MM = 273;
export const PHOTO_ID_HEADER_MM = 156;
export const PHOTO_ID_PAGE_NO_MM = 12;
export const PHOTO_ID_LOG_MM = 28;
export const PHOTO_ID_SIGNS_MM = 52;
export const PHOTO_ID_PHOTO_COUNT = 8;
export const PHOTO_ID_RESULT_MIN = 4;

export const PHOTO_ID_RESULT_FIELD = {
  key: "result" as const,
  label: "๔. ผลการชี้รูปปรากฏว่า",
  minLines: PHOTO_ID_RESULT_MIN,
};

export type PhotoIdFlowFieldKey = typeof PHOTO_ID_RESULT_FIELD.key;

export type PhotoIdPageBodySlice = {
  key: PhotoIdFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type PhotoIdPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  result: PhotoIdPageBodySlice | null;
  showLog: boolean;
  showSigns: boolean;
};

export type PhotoIdFields = {
  recordPlace: string;
  day: string;
  month: string;
  year: string;
  director: string;
  caseCharge: string;
  suspectName: string;
  criminalCaseNo: string;
  criminalCharge: string;
  identifierName: string;
  suspectNo: string;
  idDay: string;
  idMonth: string;
  idYear: string;
  idTime: string;
  photoCount: string;
  photos: string[];
  identifierName2: string;
  result: string;
  dailyLogItem: string;
  dailyLogTime: string;
  logDay: string;
  logMonth: string;
  logYear: string;
  signComplainant: string;
  signComplainantParen: string;
  signWitnessId: string;
  signWitnessIdParen: string;
  signWitness1: string;
  signWitness1Paren: string;
  signWitness2: string;
  signWitness2Paren: string;
  signDirector: string;
  signDirectorParen: string;
  signOfficer: string;
  signOfficerParen: string;
  officerPosition: string;
};

export function createEmptyPhotoIdFields(): PhotoIdFields {
  return {
    recordPlace: "",
    day: "",
    month: "",
    year: "",
    director: "",
    caseCharge: "",
    suspectName: "",
    criminalCaseNo: "",
    criminalCharge: "",
    identifierName: "",
    suspectNo: "",
    idDay: "",
    idMonth: "",
    idYear: "",
    idTime: "",
    photoCount: "",
    photos: Array.from({ length: PHOTO_ID_PHOTO_COUNT }, () => ""),
    identifierName2: "",
    result: "",
    dailyLogItem: "",
    dailyLogTime: "",
    logDay: "",
    logMonth: "",
    logYear: "",
    signComplainant: "",
    signComplainantParen: "",
    signWitnessId: "",
    signWitnessIdParen: "",
    signWitness1: "",
    signWitness1Paren: "",
    signWitness2: "",
    signWitness2Paren: "",
    signDirector: "",
    signDirectorParen: "",
    signOfficer: "",
    signOfficerParen: "",
    officerPosition: "",
  };
}

function emptyPage(index: number): PhotoIdPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    result: null,
    showLog: false,
    showSigns: false,
  };
}

export function packPhotoIdPages(
  fields: PhotoIdFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): PhotoIdPageModel[] {
  const pages: PhotoIdPageModel[] = [];
  let page = emptyPage(0);
  let used = PHOTO_ID_HEADER_MM;

  function remaining(): number {
    return PHOTO_ID_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = PHOTO_ID_PAGE_NO_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  let rest = fields.result;
  let first = true;
  let sliceIndex = 0;
  while (true) {
    const indentCh = first ? PHOTO_ID_RESULT_FIELD.label.length + 1 : 0;
    const contentLines = countLines(rest, indentCh);
    const wanted = Math.max(first ? PHOTO_ID_RESULT_FIELD.minLines : 1, contentLines);
    const availLines = Math.floor(remaining() / PHOTO_ID_LINE_MM);
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
    page.result = {
      key: PHOTO_ID_RESULT_FIELD.key,
      label: PHOTO_ID_RESULT_FIELD.label,
      text: head,
      lines: takeLines,
      showLabel: first,
      sliceIndex,
    };
    used += takeLines * PHOTO_ID_LINE_MM + 0.4;
    rest = tail;
    first = false;
    sliceIndex += 1;
    if (!rest) break;
    flush();
  }

  if (page.index === 0) flush();

  need(PHOTO_ID_LOG_MM + PHOTO_ID_SIGNS_MM);
  page.showLog = true;
  page.showSigns = true;

  pages.push(page);
  return pages;
}

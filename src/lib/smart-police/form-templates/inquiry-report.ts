import {
  estimateArrestWrappedLines,
  splitArrestTextByLines,
} from "@/lib/smart-police/form-templates/arrest-record";

export const INQUIRY_REPORT_LINE_MM = 6.2;
export const INQUIRY_REPORT_PAGE_INNER_MM = 273;
export const INQUIRY_REPORT_HEADER_MM = 142;
export const INQUIRY_REPORT_PAGE_NO_MM = 12;
export const INQUIRY_REPORT_CONT_HEADER_MM = 22;
export const INQUIRY_REPORT_CLOSING_MM = 10;
export const INQUIRY_REPORT_SIGNS_MM = 22;
export const INQUIRY_REPORT_BODY_MIN = 8;
export const INQUIRY_REPORT_MIN_PAGES = 3;

export const INQUIRY_REPORT_BODY_FIELD = {
  key: "body" as const,
  label: "",
  minLines: INQUIRY_REPORT_BODY_MIN,
};

export const INQUIRY_REPORT_BODY_TEMPLATE = [
  "คดีนี้กล่าวหาว่า ตามวันเวลาที่เกิดเหตุ                         ผู้ต้องหาในคดีนี้ ได้กระทำความผิดฐาน",
  "เหตุเกิด",
  "บัดนี้การสอบสวนได้เสร็จสิ้นแล้ว สรุปผลการสอบสวนได้ความดังนี้",
  "การสอบสวนผู้กล่าวหา มี        ปาก คือ",
  "สอบสวน                                ผู้กล่าวหา ให้การว่า",
  "การสอบสวนผู้ต้องหา มี       ปาก คือ",
  "สอบสวน                                ผู้ต้องหา ให้การตลอดข้อกล่าวหา ว่า",
  "การสอบสวนพยาน มี        ปาก คือ",
  "สอบสวน                                 พยาน ให้การว่า  เป็น                   ในคดีนี้",
  "วัตถุพยานและพยานเอกสาร",
  "        วัตถุพยาน  มี         รายการ คือ",
  "๑.",
  "        พยานเอกสาร  ไม่มี",
  "หลักฐานทางคดีและความเห็นของพนักงานสอบสวน",
  "คดีนี้ข้อเท็จจริงฟังได้ความว่าเมื่อวันที่",
  "คดีมี                                และ                                           พยานในคดีนี้ เป็นพยาน ยืนยันการกระทำความผิดของผู้ต้องหา ตามข้อเท็จจริงดังกล่าวข้างต้น จากการสอบสวนผู้ต้องหาให้การ   ตลอดข้อกล่าวหา มีของกลาง                 เป็นวัตถุพยานยืนยันการกระทำผิดของผู้ต้องหา",
  "ทางคดีจึงมีพยานหลักฐานเพียงพอเชื่อได้ว่า ผู้ต้องหาในคดีนี้ ได้กระทำความผิดตามข้อกล่าวหาจริงฐาน",
  "จึงเห็นควร                                              ผู้ต้องหาในคดีนี้ ตามข้อกล่าวหาและพยานหลักฐานดังกล่าวข้างต้น",
].join("\n") + "\n";

export type InquiryReportFlowFieldKey = typeof INQUIRY_REPORT_BODY_FIELD.key;

export type InquiryReportPageBodySlice = {
  key: InquiryReportFlowFieldKey;
  label: string;
  text: string;
  lines: number;
  showLabel: boolean;
  sliceIndex: number;
};

export type InquiryReportPageModel = {
  index: number;
  showHeader: boolean;
  showPageNo: boolean;
  showContHeader: boolean;
  body: InquiryReportPageBodySlice | null;
  showClosing: boolean;
  showSigns: boolean;
};

export type InquiryReportFields = {
  caseNo: string;
  station: string;
  district: string;
  province: string;
  day: string;
  month: string;
  year: string;
  submitTo: string;
  complainant: string;
  suspect: string;
  charge: string;
  incidentWhen: string;
  incidentPlace: string;
  complaintWhen: string;
  body: string;
  signName: string;
  signPrinted: string;
};

export function createEmptyInquiryReportFields(): InquiryReportFields {
  return {
    caseNo: "",
    station: "",
    district: "",
    province: "",
    day: "",
    month: "",
    year: "",
    submitTo: "",
    complainant: "",
    suspect: "",
    charge: "",
    incidentWhen: "",
    incidentPlace: "",
    complaintWhen: "",
    body: INQUIRY_REPORT_BODY_TEMPLATE,
    signName: "",
    signPrinted: "",
  };
}

function emptyPage(index: number): InquiryReportPageModel {
  return {
    index,
    showHeader: index === 0,
    showPageNo: index > 0,
    showContHeader: index > 0,
    body: null,
    showClosing: false,
    showSigns: false,
  };
}

export function packInquiryReportPages(
  fields: InquiryReportFields,
  countLines: (text: string, indentCh: number) => number = estimateArrestWrappedLines,
): InquiryReportPageModel[] {
  const pages: InquiryReportPageModel[] = [];
  let page = emptyPage(0);
  let used = INQUIRY_REPORT_HEADER_MM;

  function remaining(): number {
    return INQUIRY_REPORT_PAGE_INNER_MM - used;
  }

  function flush() {
    pages.push(page);
    page = emptyPage(pages.length);
    used = INQUIRY_REPORT_PAGE_NO_MM + INQUIRY_REPORT_CONT_HEADER_MM;
  }

  function need(mm: number) {
    if (remaining() >= mm - 0.2) return;
    flush();
  }

  const footerMm = INQUIRY_REPORT_CLOSING_MM + INQUIRY_REPORT_SIGNS_MM;
  const footerLines = Math.ceil(footerMm / INQUIRY_REPORT_LINE_MM);

  let rest = fields.body;
  let sliceIndex = 0;

  function takeBodySlice(keepFooter: boolean) {
    const rawAvail = Math.floor(remaining() / INQUIRY_REPORT_LINE_MM);
    if (rawAvail < 1) {
      flush();
      return takeBodySlice(keepFooter);
    }
    const maxLines = keepFooter
      ? Math.max(INQUIRY_REPORT_BODY_FIELD.minLines, rawAvail - footerLines)
      : rawAvail;
    const contentLines = countLines(rest, 0);
    const takeLines = keepFooter
      ? Math.min(maxLines, Math.max(INQUIRY_REPORT_BODY_FIELD.minLines, contentLines, 1))
      : Math.max(maxLines, 1);
    const [head, tail] =
      contentLines > takeLines
        ? splitArrestTextByLines(rest, takeLines, 0, countLines)
        : [rest, ""];
    if (!head && tail) {
      flush();
      return takeBodySlice(keepFooter);
    }
    page.body = {
      key: INQUIRY_REPORT_BODY_FIELD.key,
      label: INQUIRY_REPORT_BODY_FIELD.label,
      text: head,
      lines: takeLines,
      showLabel: false,
      sliceIndex,
    };
    used += takeLines * INQUIRY_REPORT_LINE_MM + 0.4;
    rest = tail;
    sliceIndex += 1;
  }

  function keepFooterHere(): boolean {
    const rawAvail = Math.floor(remaining() / INQUIRY_REPORT_LINE_MM);
    const availKeep = rawAvail - footerLines;
    const contentLines = countLines(rest, 0);
    if (contentLines > Math.max(1, availKeep)) return false;
    if (pages.length + 1 < INQUIRY_REPORT_MIN_PAGES) return false;
    return true;
  }

  takeBodySlice(false);
  while (rest || pages.length + 1 < INQUIRY_REPORT_MIN_PAGES) {
    flush();
    takeBodySlice(keepFooterHere());
    if (!rest && pages.length + 1 >= INQUIRY_REPORT_MIN_PAGES) break;
  }

  need(INQUIRY_REPORT_CLOSING_MM + INQUIRY_REPORT_SIGNS_MM);
  page.showClosing = true;
  page.showSigns = true;

  pages.push(page);
  return pages;
}

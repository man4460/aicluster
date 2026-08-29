import {
  openAppSlipPrintWindow,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import {
  buildDormInvoiceBillInnerHtml,
  type DormInvoicePrintPayload,
} from "@/systems/dormitory/dorm-invoice-print-html";

/** พิมพ์ใบแจ้งหนี้ — เลย์เอาต์เดียวกับใบเสร็จ (58 กึ่งกลาง · 80/A4 ชิดซ้าย) */
export function printDormInvoice(
  sheet: DormInvoicePrintPayload,
  paper: AppSlipPaperSize | string | null,
): boolean {
  const resolved = resolveAppSlipPaperSize(paper);
  const inner = buildDormInvoiceBillInnerHtml(sheet, resolved === "A4" ? "a4Preview" : "slip", resolved);
  const docTitle = `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`;
  return openAppSlipPrintWindow(
    resolved,
    inner,
    docTitle,
    resolved === "A4" ? { a4TightVerticalMargins: true } : undefined,
  );
}

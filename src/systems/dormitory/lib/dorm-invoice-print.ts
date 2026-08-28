import {
  openPosTableBillPrintWindow,
  type PosTablePaperSize,
} from "@/systems/building-pos/pos-table-bill-print";
import {
  buildDormInvoiceBillInnerHtml,
  type DormInvoicePrintPayload,
} from "@/systems/dormitory/dorm-invoice-print-html";
import { resolveAppSlipPaperSize, type AppSlipPaperSize } from "@/components/app-templates/slip-print";

const DORM_A4_PAGE = { a4TightVerticalMargins: true as const };

/** พิมพ์ใบแจ้งหนี้ — 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย */
export function printDormInvoice(
  sheet: DormInvoicePrintPayload,
  paper: AppSlipPaperSize | string | null,
): boolean {
  const resolved = resolveAppSlipPaperSize(paper);
  const inner = buildDormInvoiceBillInnerHtml(
    sheet,
    resolved === "A4" ? "a4Preview" : "slip",
    resolved,
  );
  const pageOpts = resolved === "A4" ? DORM_A4_PAGE : undefined;
  const docTitle = `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`;
  return openPosTableBillPrintWindow(resolved as PosTablePaperSize, inner, docTitle, pageOpts);
}

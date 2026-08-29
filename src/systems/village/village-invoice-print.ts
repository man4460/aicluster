import {
  buildPosTableStaticDocumentHtml,
  openPosTableBillPrintWindow,
  type PosTablePaperSize,
} from "@/systems/building-pos/pos-table-bill-print";
import { downloadPosTableStaticHtmlAsA4Pdf } from "@/systems/building-pos/pos-table-bill-pdf-capture";
import {
  buildVillageInvoiceInnerHtml,
  buildVillageInvoicesBatchInnerHtml,
  type VillageInvoicePrintPayload,
} from "@/systems/village/village-invoice-print-html";
import { resolveAppSlipPaperSize, type AppSlipPaperSize } from "@/components/app-templates/slip-print";

const VILLAGE_A4_PAGE = { a4TightVerticalMargins: true as const };

function invoiceDocTitle(sheet: VillageInvoicePrintPayload): string {
  return `ใบแจ้งหนี้ค่าส่วนกลาง บ้าน ${sheet.houseNo}`;
}

export function safeVillageInvoicePdfFileName(houseNo: string, periodMonth: string): string {
  return `village-invoice-${houseNo}-${periodMonth}.pdf`.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
}

/** พิมพ์ใบแจ้งหนี้ — ฟอร์มเดียวกับใบเสร็จ (58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย) */
export function printVillageInvoice(
  sheet: VillageInvoicePrintPayload,
  paper: AppSlipPaperSize | string | null,
): boolean {
  const resolved = resolveAppSlipPaperSize(paper);
  const inner = buildVillageInvoiceInnerHtml(sheet, "slip", resolved);
  const pageOpts = resolved === "A4" ? VILLAGE_A4_PAGE : undefined;
  return openPosTableBillPrintWindow(resolved as PosTablePaperSize, inner, invoiceDocTitle(sheet), pageOpts);
}

/** พิมพ์ใบแจ้งหนี้หลายหลังในเอกสารเดียว (หน้าละใบ) */
export function printVillageInvoicesBatch(
  sheets: VillageInvoicePrintPayload[],
  paper: AppSlipPaperSize | string | null,
): boolean {
  if (sheets.length === 0) return false;
  const resolved = resolveAppSlipPaperSize(paper);
  const inner = buildVillageInvoicesBatchInnerHtml(sheets, resolved);
  const title =
    sheets.length === 1
      ? invoiceDocTitle(sheets[0]!)
      : `ใบแจ้งหนี้ค่าส่วนกลาง ${sheets.length} หลัง · ${sheets[0]?.periodMonth ?? ""}`;
  const pageOpts = resolved === "A4" ? VILLAGE_A4_PAGE : undefined;
  return openPosTableBillPrintWindow(resolved as PosTablePaperSize, inner, title, pageOpts);
}

/** ดาวน์โหลด PDF จาก HTML สีแบบ hex (เลี่ยง oklab ของ Tailwind) — เสมอ A4 */
export async function downloadVillageInvoicePdf(sheet: VillageInvoicePrintPayload): Promise<void> {
  const inner = buildVillageInvoiceInnerHtml(sheet, "slip", "A4");
  const fullHtml = buildPosTableStaticDocumentHtml("A4", inner, invoiceDocTitle(sheet), VILLAGE_A4_PAGE);
  await downloadPosTableStaticHtmlAsA4Pdf(fullHtml, safeVillageInvoicePdfFileName(sheet.houseNo, sheet.periodMonth), {
    iframeTitle: "สร้าง PDF ใบแจ้งหนี้ค่าส่วนกลาง",
    notFoundMessage: "ไม่พบเนื้อหาใบแจ้งหนี้",
    pollForRootMaxMs: 18_000,
    captureTimeoutMs: 50_000,
    html2canvasScale: 1,
  });
}

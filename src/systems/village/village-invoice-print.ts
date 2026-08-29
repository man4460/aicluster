import {
  buildPosTableStaticDocumentHtml,
  openPosTableBillPrintWindow,
} from "@/systems/building-pos/pos-table-bill-print";
import { downloadPosTableStaticHtmlAsA4Pdf } from "@/systems/building-pos/pos-table-bill-pdf-capture";
import {
  buildVillageInvoiceInnerHtml,
  type VillageInvoicePrintPayload,
} from "@/systems/village/village-invoice-print-html";

const VILLAGE_A4_PAGE = { a4TightVerticalMargins: true as const };

function invoiceDocTitle(sheet: VillageInvoicePrintPayload): string {
  return `ใบแจ้งหนี้ค่าส่วนกลาง บ้าน ${sheet.houseNo}`;
}

export function safeVillageInvoicePdfFileName(houseNo: string, periodMonth: string): string {
  return `village-invoice-${houseNo}-${periodMonth}.pdf`.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
}

/** พิมพ์ใบแจ้งหนี้ค่าส่วนกลางแบบ A4 */
export function printVillageInvoice(sheet: VillageInvoicePrintPayload): boolean {
  const inner = buildVillageInvoiceInnerHtml(sheet);
  return openPosTableBillPrintWindow("A4", inner, invoiceDocTitle(sheet), VILLAGE_A4_PAGE);
}

/** ดาวน์โหลด PDF จาก HTML สีแบบ hex (เลี่ยง oklab ของ Tailwind) */
export async function downloadVillageInvoicePdf(sheet: VillageInvoicePrintPayload): Promise<void> {
  const inner = buildVillageInvoiceInnerHtml(sheet);
  const fullHtml = buildPosTableStaticDocumentHtml("A4", inner, invoiceDocTitle(sheet), VILLAGE_A4_PAGE);
  await downloadPosTableStaticHtmlAsA4Pdf(fullHtml, safeVillageInvoicePdfFileName(sheet.houseNo, sheet.periodMonth), {
    iframeTitle: "สร้าง PDF ใบแจ้งหนี้ค่าส่วนกลาง",
    notFoundMessage: "ไม่พบเนื้อหาใบแจ้งหนี้",
    pollForRootMaxMs: 18_000,
    captureTimeoutMs: 50_000,
    html2canvasScale: 1,
  });
}

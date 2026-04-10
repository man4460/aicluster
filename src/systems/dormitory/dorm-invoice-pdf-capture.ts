import { buildPosTableStaticDocumentHtml } from "@/systems/building-pos/pos-table-bill-print";
import { downloadPosTableStaticHtmlAsA4Pdf } from "@/systems/building-pos/pos-table-bill-pdf-capture";
import {
  buildDormInvoiceBillInnerHtml,
  type DormInvoicePrintPayload,
} from "@/systems/dormitory/dorm-invoice-print-html";

/**
 * สร้าง PDF จาก HTML พิมพ์ (สี hex ใน &lt;style&gt; เท่านั้น) — หลีกเลี่ยง oklab จาก Tailwind
 */
export async function downloadDormInvoicePdfFromCleanHtml(
  sheet: DormInvoicePrintPayload,
  filename: string,
  docTitle: string,
): Promise<void> {
  const innerHtml = buildDormInvoiceBillInnerHtml(sheet, "a4Preview");
  const fullHtml = buildPosTableStaticDocumentHtml("A4", innerHtml, docTitle, {
    a4TightVerticalMargins: true,
  });
  await downloadPosTableStaticHtmlAsA4Pdf(fullHtml, filename, {
    iframeTitle: "สร้าง PDF ใบแจ้งหนี้",
    notFoundMessage: "ไม่พบเนื้อหาใบแจ้งหนี้",
  });
}

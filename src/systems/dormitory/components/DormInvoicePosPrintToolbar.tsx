"use client";

import { useCallback, useState } from "react";
import { appTemplateOutlineButtonClass } from "@/components/app-templates/dashboard-tokens";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { downloadDormInvoicePdfFromCleanHtml } from "@/systems/dormitory/dorm-invoice-pdf-capture";
import {
  buildDormInvoiceBillInnerHtml,
  type DormInvoicePrintPayload,
} from "@/systems/dormitory/dorm-invoice-print-html";
import {
  openPosTableBillPrintWindow,
  type PosTablePaperSize,
} from "@/systems/building-pos/pos-table-bill-print";
import { safeDormInvoicePdfFileName } from "@/lib/dormitory/dorm-invoice-pdf-filename";
import { cn } from "@/lib/cn";

const DORM_A4_PAGE = { a4TightVerticalMargins: true as const };

export function DormInvoicePosPrintToolbar({
  sheet,
  className,
}: {
  sheet: DormInvoicePrintPayload;
  className?: string;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);

  const innerSlip = buildDormInvoiceBillInnerHtml(sheet, "slip");
  const innerA4 = buildDormInvoiceBillInnerHtml(sheet, "a4Preview");
  const docTitle = `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`;

  const onPrint = useCallback(
    (paper: PosTablePaperSize) => {
      const inner = paper === "A4" ? innerA4 : innerSlip;
      const pageOpts = paper === "A4" ? DORM_A4_PAGE : undefined;
      const ok = openPosTableBillPrintWindow(paper, inner, docTitle, pageOpts);
      if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF");
    },
    [innerSlip, innerA4, docTitle],
  );

  const onPdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      await downloadDormInvoicePdfFromCleanHtml(
        sheet,
        safeDormInvoicePdfFileName(sheet.roomNumber, sheet.periodMonth),
        docTitle,
      );
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ");
    } finally {
      setPdfBusy(false);
    }
  }, [sheet, docTitle]);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button type="button" className={appTemplateOutlineButtonClass} onClick={() => onPrint("SLIP_58")}>
        พิมพ์ 58 mm
      </button>
      <button type="button" className={appTemplateOutlineButtonClass} onClick={() => onPrint("SLIP_80")}>
        พิมพ์ 80 mm
      </button>
      <button type="button" className={appTemplateOutlineButtonClass} onClick={() => onPrint("A4")}>
        พิมพ์ A4
      </button>
      <button
        type="button"
        className={shopQrTemplateGridPrimaryButtonClass}
        disabled={pdfBusy}
        onClick={() => void onPdf()}
      >
        {pdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
      </button>
    </div>
  );
}

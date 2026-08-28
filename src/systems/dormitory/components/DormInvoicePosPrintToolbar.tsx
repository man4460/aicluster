"use client";

import { useCallback, useState } from "react";
import {
  AppSlipPaperSizeToolbar,
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { safeDormInvoicePdfFileName } from "@/lib/dormitory/dorm-invoice-pdf-filename";
import { cn } from "@/lib/cn";
import { downloadDormInvoicePdfFromCleanHtml } from "@/systems/dormitory/dorm-invoice-pdf-capture";
import type { DormInvoicePrintPayload } from "@/systems/dormitory/dorm-invoice-print-html";
import { printDormInvoice } from "@/systems/dormitory/lib/dorm-invoice-print";

export function DormInvoicePosPrintToolbar({
  sheet,
  defaultPaperSize,
  className,
}: {
  sheet: DormInvoicePrintPayload;
  defaultPaperSize?: string | null;
  className?: string;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);
  const docTitle = `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`;

  const onPrint = useCallback(() => {
    const ok = printDormInvoice(sheet, paper);
    if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF");
  }, [sheet, paper]);

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
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AppSlipPaperSizeToolbar
        value={paper}
        onChange={setPaper}
        sizes={["SLIP_58", "SLIP_80", "A4"]}
        aria-label="ขนาดกระดาษใบแจ้งหนี้"
      />
      <button type="button" className={appTemplateOutlineButtonClass} onClick={onPrint}>
        พิมพ์
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

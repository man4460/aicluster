"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  AppSlipPaperSizeToolbar,
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { safeDormInvoicePdfFileName } from "@/lib/dormitory/dorm-invoice-pdf-filename";
import { cn } from "@/lib/cn";
import { downloadDormInvoicePdfFromCleanHtml } from "@/systems/dormitory/dorm-invoice-pdf-capture";
import {
  buildDormInvoiceBillInnerHtml,
  type DormInvoicePrintPayload,
} from "@/systems/dormitory/dorm-invoice-print-html";
import { printDormInvoice } from "@/systems/dormitory/lib/dorm-invoice-print";

function dormInvoicePreviewWidthClass(paper: AppSlipPaperSize): string {
  if (paper === "A4") return "w-full max-w-[210mm]";
  if (paper === "SLIP_80") return "mx-auto w-full max-w-[80mm]";
  return "mx-auto w-full max-w-[58mm]";
}

function dormInvoicePreviewOuterClass(paper: AppSlipPaperSize): string {
  if (paper === "A4") return "w-full";
  return "flex w-full justify-center px-2 sm:px-4";
}

export function DormInvoicePageClient({
  sheet,
  defaultPaperSize,
  toolbarExtra,
  showSizeHint = true,
}: {
  sheet: DormInvoicePrintPayload;
  defaultPaperSize?: string | null;
  toolbarExtra?: ReactNode;
  showSizeHint?: boolean;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);

  const previewHtml = useMemo(() => {
    const layout = paper === "A4" ? "a4Preview" : "slip";
    return buildDormInvoiceBillInnerHtml(sheet, layout, paper);
  }, [sheet, paper]);

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
    <div className="space-y-4">
      <div className={dormInvoicePreviewOuterClass(paper)}>
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
            dormInvoicePreviewWidthClass(paper),
          )}
        >
          <div
            className={cn(
              "overflow-hidden text-slate-900",
              paper === "A4" ? "p-4 sm:p-6 md:p-8" : "p-2 sm:p-3",
            )}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      <div className="no-print app-surface rounded-2xl p-3 sm:p-4">
        <p className="text-xs font-semibold text-[#2e2a58]">เครื่องมือใบแจ้งหนี้</p>
        <p className="mt-1 text-[11px] text-[#66638c]">ส่วนนี้ไม่ถูกพิมพ์</p>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
          {showSizeHint ? (
            <p className="text-xs text-slate-500">
              เลือกขนาดกระดาษแล้วกดพิมพ์ — 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย (มาตรฐานเดียวกับ POS /
              โรงแรม)
            </p>
          ) : null}
          {toolbarExtra}
        </div>
      </div>
    </div>
  );
}

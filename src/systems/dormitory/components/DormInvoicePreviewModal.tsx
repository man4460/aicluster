"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { safeDormInvoicePdfFileName } from "@/lib/dormitory/dorm-invoice-pdf-filename";
import { cn } from "@/lib/cn";
import { downloadDormInvoicePdfFromCleanHtml } from "@/systems/dormitory/dorm-invoice-pdf-capture";
import type { DormInvoicePrintPayload } from "@/systems/dormitory/dorm-invoice-print-html";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { DormInvoiceSheetContent, type DormInvoiceSheetContentProps } from "./DormInvoiceSheetContent";

type Props = Omit<DormInvoiceSheetContentProps, "printRootId" | "className">;

export function DormInvoicePreviewModal(props: Props) {
  const [open, setOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const titleId = useId();

  const onClose = useCallback(() => setOpen(false), []);

  const onDownloadPdf = useCallback(async () => {
    const sheet: DormInvoicePrintPayload = {
      dormName: props.dormName,
      logoUrl: props.logoUrl ?? null,
      taxId: props.taxId ?? null,
      address: props.address ?? null,
      caretakerPhone: props.caretakerPhone ?? null,
      roomNumber: props.roomNumber,
      tenantName: props.tenantName,
      tenantPhone: props.tenantPhone,
      periodMonth: props.periodMonth,
      amount: props.amount,
      paymentChannelsNote: props.paymentChannelsNote ?? null,
      promptPayQrDataUrl: props.promptPayQrDataUrl ?? null,
      slipUploadQrDataUrl: props.slipUploadQrDataUrl ?? null,
    };
    const docTitle = `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`;
    const filename = safeDormInvoicePdfFileName(sheet.roomNumber, sheet.periodMonth);
    setPdfBusy(true);
    try {
      await downloadDormInvoicePdfFromCleanHtml(sheet, filename, docTitle);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ");
    } finally {
      setPdfBusy(false);
    }
  }, [props]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          dormBtnSecondary,
          "inline-flex w-full justify-center border-indigo-200/80 bg-indigo-50/90 text-[#3730a3] hover:bg-indigo-100/80 sm:w-auto",
        )}
      >
        พรีวิวใบแจ้งหนี้
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/55 p-3 backdrop-blur-[2px] sm:p-5" role="presentation">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={onClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[1] mx-auto flex max-h-[min(92vh,900px)] w-full max-w-[min(100%,220mm)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-slate-50/95 px-3 py-2.5 sm:px-4 sm:py-3">
              <h2 id={titleId} className="text-sm font-bold text-slate-900 sm:text-base">
                พรีวิวใบแจ้งหนี้
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] rounded-xl text-sm font-semibold text-slate-600 transition hover:bg-slate-200/80 hover:text-slate-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
              >
                ปิด
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100/90 p-3 sm:p-5">
              <DormInvoiceSheetContent
                {...props}
                className="mx-auto max-w-[210mm] border-0 shadow-md"
              />
              <div className="no-print mx-auto mt-4 flex max-w-[210mm] justify-center sm:justify-end">
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={() => void onDownloadPdf()}
                  className={cn(shopQrTemplateGridPrimaryButtonClass, "min-h-[44px] w-full sm:w-auto")}
                >
                  {pdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

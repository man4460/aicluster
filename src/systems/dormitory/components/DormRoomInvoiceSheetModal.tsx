"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import type { DormInvoiceSheetDto } from "@/lib/dormitory/dorm-invoice-sheet";
import { safeDormInvoicePdfFileName } from "@/lib/dormitory/dorm-invoice-pdf-filename";
import { cn } from "@/lib/cn";
import { downloadDormInvoicePdfFromCleanHtml } from "@/systems/dormitory/dorm-invoice-pdf-capture";
import type { DormInvoicePrintPayload } from "@/systems/dormitory/dorm-invoice-print-html";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { DormInvoicePosPrintToolbar } from "./DormInvoicePosPrintToolbar";
import { DormInvoicePrintStyles } from "./DormInvoicePrintStyles";
import { DormInvoiceSheetContent } from "./DormInvoiceSheetContent";

export function DormRoomInvoiceSheetModal({
  paymentId,
  roomId,
  roomNumber,
  onClose,
}: {
  paymentId: number;
  roomId: string;
  roomNumber: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [data, setData] = useState<DormInvoiceSheetDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerPdfBusy, setHeaderPdfBusy] = useState(false);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const downloadInvoicePdf = useCallback(async () => {
    if (!data) return;
    const sheet: DormInvoicePrintPayload = {
      dormName: data.dormName,
      logoUrl: data.logoUrl ?? null,
      taxId: data.taxId ?? null,
      address: data.address ?? null,
      caretakerPhone: data.caretakerPhone ?? null,
      roomNumber: data.roomNumber,
      tenantName: data.tenantName,
      tenantPhone: data.tenantPhone,
      periodMonth: data.periodMonth,
      amount: data.amount,
      paymentChannelsNote: data.paymentChannelsNote ?? null,
      promptPayQrDataUrl: data.promptPayQrDataUrl ?? null,
      slipUploadQrDataUrl: data.slipUploadQrDataUrl ?? null,
    };
    const docTitle = `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`;
    const filename = safeDormInvoicePdfFileName(sheet.roomNumber, sheet.periodMonth);
    setHeaderPdfBusy(true);
    try {
      await downloadDormInvoicePdfFromCleanHtml(sheet, filename, docTitle);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ");
    } finally {
      setHeaderPdfBusy(false);
    }
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setData(null);
    fetch(`/api/dorm/payments/${paymentId}/invoice-sheet`)
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { error?: string; sheet?: DormInvoiceSheetDto };
        if (!r.ok) throw new Error(j.error || "โหลดไม่สำเร็จ");
        if (!j.sheet) throw new Error("ข้อมูลไม่ครบ");
        return j.sheet;
      })
      .then((sheet) => {
        if (!cancelled) {
          setData(sheet);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [handleClose]);

  const sheetProps = data
    ? {
        dormName: data.dormName,
        logoUrl: data.logoUrl,
        taxId: data.taxId,
        address: data.address,
        caretakerPhone: data.caretakerPhone,
        roomNumber: data.roomNumber,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        periodMonth: data.periodMonth,
        amount: data.amount,
        paymentChannelsNote: data.paymentChannelsNote,
        promptPayQrDataUrl: data.promptPayQrDataUrl,
        slipUploadQrDataUrl: data.slipUploadQrDataUrl,
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/55 p-2 backdrop-blur-[2px] sm:p-4"
      role="presentation"
    >
      <DormInvoicePrintStyles />
      <div className="absolute inset-0" aria-hidden onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] mx-auto flex max-h-[min(96vh,920px)] w-full max-w-[min(100%,220mm)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-slate-50/95 px-3 py-2.5 sm:px-4 sm:py-3">
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 sm:text-base">
            ใบแจ้งหนี้ · ห้อง {roomNumber}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {data && !loading && !err ? (
              <button
                type="button"
                disabled={headerPdfBusy}
                onClick={() => void downloadInvoicePdf()}
                className={cn(
                  shopQrTemplateGridPrimaryButtonClass,
                  "min-h-[40px] whitespace-nowrap px-3 py-2 text-xs font-semibold sm:min-h-0 sm:text-sm",
                )}
              >
                {headerPdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] min-w-[44px] rounded-xl text-sm font-semibold text-slate-600 transition hover:bg-slate-200/80 hover:text-slate-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
            >
              ปิด
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100/90 p-3 sm:p-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-600">กำลังโหลดใบแจ้งหนี้…</p>
          ) : err ? (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-6 text-center">
              <p className="text-sm font-medium text-red-800">{err}</p>
              <button
                type="button"
                onClick={handleClose}
                className={cn(dormBtnSecondary, "mt-4 inline-flex justify-center")}
              >
                ปิด
              </button>
            </div>
          ) : sheetProps ? (
            <div className="space-y-4">
              <DormInvoiceSheetContent {...sheetProps} printRootId="dorm-invoice-root" />

              <div className="no-print app-surface rounded-2xl p-3 sm:p-4">
                <p className="text-xs font-semibold text-[#2e2a58]">เครื่องมือใบแจ้งหนี้</p>
                <p className="mt-1 text-[11px] text-[#66638c]">ส่วนนี้ไม่ถูกพิมพ์</p>
                <div className="mt-3 flex flex-col gap-3">
                  <DormInvoicePosPrintToolbar sheet={sheetProps} />
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Link
                      href={`/dashboard/dormitory/invoice/${paymentId}`}
                      className={cn(
                        dormBtnSecondary,
                        "inline-flex w-full justify-center text-center sm:w-auto",
                      )}
                    >
                      เปิดแบบเต็มหน้า
                    </Link>
                    <Link
                      href={`/dashboard/dormitory/rooms/${roomId}`}
                      className={cn(dormBtnSecondary, "inline-flex w-full justify-center sm:w-auto")}
                    >
                      กลับห้อง {roomNumber}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

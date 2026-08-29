"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import type { VillageInvoiceSheetDto } from "@/lib/village/village-invoice-sheet";
import { VillageInvoiceSheetContent } from "@/systems/village/components/VillageInvoiceSheetContent";
import { downloadVillageInvoicePdf, printVillageInvoice } from "@/systems/village/village-invoice-print";
import type { VillageInvoicePrintPayload } from "@/systems/village/village-invoice-print-html";
import { villageBtnPrimary, villageBtnSecondary } from "@/systems/village/village-ui";

function subscribeToClient() {
  return () => {};
}

function toPrintPayload(sheet: VillageInvoiceSheetDto): VillageInvoicePrintPayload {
  return {
    villageName: sheet.villageName,
    address: sheet.address,
    contactPhone: sheet.contactPhone,
    houseNo: sheet.houseNo,
    residentName: sheet.residentName,
    residentPhone: sheet.residentPhone,
    periodMonth: sheet.periodMonth,
    amount: sheet.amount,
    paymentChannelsNote: sheet.paymentChannelsNote,
    bankName: sheet.bankName,
    bankAccountNumber: sheet.bankAccountNumber,
    bankAccountName: sheet.bankAccountName,
    promptPayQrDataUrl: sheet.promptPayQrDataUrl,
    slipUploadQrDataUrl: sheet.slipUploadQrDataUrl,
  };
}

export function VillageInvoiceSheetModal({
  feeRowId,
  houseNo,
  onClose,
}: {
  feeRowId: number;
  houseNo: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const [sheet, setSheet] = useState<VillageInvoiceSheetDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setSheet(null);
    fetch(`/api/village/session/fee-rows/${feeRowId}/invoice-sheet`, { credentials: "include" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { error?: string; sheet?: VillageInvoiceSheetDto };
        if (!r.ok) throw new Error(j.error || "โหลดไม่สำเร็จ");
        if (!j.sheet) throw new Error("ข้อมูลไม่ครบ");
        return j.sheet;
      })
      .then((s) => {
        if (cancelled) return;
        setSheet(s);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [feeRowId]);

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

  const copyUploadLink = useCallback(async () => {
    if (!sheet) return;
    try {
      await navigator.clipboard.writeText(sheet.uploadPageAbs);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("คัดลอกลิงก์แนบสลิป", sheet.uploadPageAbs);
    }
  }, [sheet]);

  const downloadPdf = useCallback(async () => {
    if (!sheet) return;
    setPdfBusy(true);
    try {
      await downloadVillageInvoicePdf(toPrintPayload(sheet));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ");
    } finally {
      setPdfBusy(false);
    }
  }, [sheet]);

  if (!isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-3 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        aria-label="ปิดหน้าต่าง"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-[min(100%,220mm)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/90 bg-slate-50/95 px-3 py-2.5 sm:px-4 sm:py-3">
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 sm:text-base">
            ใบแจ้งหนี้ · บ้าน {houseNo}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] min-w-[44px] rounded-xl text-sm font-semibold text-slate-600 transition hover:bg-slate-200/80 hover:text-slate-900 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
          >
            ปิด
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-100/90 p-3 sm:p-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-600">กำลังโหลดใบแจ้งหนี้…</p>
          ) : err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-6 text-center">
              <p className="text-sm font-medium text-rose-800">{err}</p>
              <button type="button" onClick={handleClose} className={cn(villageBtnSecondary, "mt-4")}>
                ปิด
              </button>
            </div>
          ) : sheet ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-sm">
                <button
                  type="button"
                  className={cn(villageBtnPrimary, "min-w-[6.5rem] flex-1 sm:flex-none")}
                  onClick={() => {
                    if (!printVillageInvoice(toPrintPayload(sheet))) {
                      window.alert("เบราว์เซอร์บล็อกหน้าต่างพิมพ์ — อนุญาต popup แล้วลองใหม่");
                    }
                  }}
                >
                  พิมพ์
                </button>
                <button
                  type="button"
                  disabled={pdfBusy}
                  className={cn(villageBtnSecondary, "min-w-[6.5rem] flex-1 sm:flex-none")}
                  onClick={() => void downloadPdf()}
                >
                  {pdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
                </button>
                <button
                  type="button"
                  className={cn(villageBtnSecondary, "min-w-[6.5rem] flex-1 sm:flex-none")}
                  onClick={() => void copyUploadLink()}
                >
                  {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์แนบสลิป"}
                </button>
                <a
                  href={sheet.uploadPagePath}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(villageBtnSecondary, "min-w-[6.5rem] flex-1 text-center sm:flex-none")}
                >
                  เปิดหน้าแนบสลิป
                </a>
              </div>
              <p className="break-all px-1 text-[11px] leading-snug text-slate-500">{sheet.uploadPageAbs}</p>
              <VillageInvoiceSheetContent
                villageName={sheet.villageName}
                address={sheet.address}
                contactPhone={sheet.contactPhone}
                houseNo={sheet.houseNo}
                residentName={sheet.residentName}
                residentPhone={sheet.residentPhone}
                periodMonth={sheet.periodMonth}
                amount={sheet.amount}
                paymentChannelsNote={sheet.paymentChannelsNote}
                bankName={sheet.bankName}
                bankAccountNumber={sheet.bankAccountNumber}
                bankAccountName={sheet.bankAccountName}
                promptPayQrDataUrl={sheet.promptPayQrDataUrl}
                slipUploadQrDataUrl={sheet.slipUploadQrDataUrl}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

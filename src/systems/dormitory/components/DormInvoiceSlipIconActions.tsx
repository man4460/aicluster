"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppImageLightbox,
  useAppImageLightbox,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { safeDormInvoicePdfFileName } from "@/lib/dormitory/dorm-invoice-pdf-filename";
import { cn } from "@/lib/cn";
import { downloadDormInvoicePdfFromCleanHtml } from "@/systems/dormitory/dorm-invoice-pdf-capture";
import type { DormInvoicePrintPayload } from "@/systems/dormitory/dorm-invoice-print-html";
import { printDormInvoice } from "@/systems/dormitory/lib/dorm-invoice-print";
import { useDormitoryApiFetch } from "@/systems/dormitory/lib/staff-api-fetch";

const iconBtnClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/90 text-[#4d47b6] shadow-sm transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
);

function IconPrint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path
        d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" strokeLinecap="round" />
    </svg>
  );
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
    </svg>
  );
}

function IconViewSlip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function sheetFromDto(sheet: {
  dormName: string;
  logoUrl?: string | null;
  taxId?: string | null;
  address?: string | null;
  caretakerPhone?: string | null;
  roomNumber: string;
  tenantName: string;
  tenantPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote?: string | null;
  promptPayQrDataUrl?: string | null;
  slipUploadQrDataUrl?: string | null;
}): DormInvoicePrintPayload {
  return {
    dormName: sheet.dormName,
    logoUrl: sheet.logoUrl ?? null,
    taxId: sheet.taxId ?? null,
    address: sheet.address ?? null,
    caretakerPhone: sheet.caretakerPhone ?? null,
    roomNumber: sheet.roomNumber,
    tenantName: sheet.tenantName,
    tenantPhone: sheet.tenantPhone,
    periodMonth: sheet.periodMonth,
    amount: sheet.amount,
    paymentChannelsNote: sheet.paymentChannelsNote ?? null,
    promptPayQrDataUrl: sheet.promptPayQrDataUrl ?? null,
    slipUploadQrDataUrl: sheet.slipUploadQrDataUrl ?? null,
  };
}

export function DormInvoiceSlipIconActions({
  paymentId,
  defaultPaperSize,
  initialProofUrl,
  onProofChanged,
  className,
}: {
  paymentId: number;
  defaultPaperSize?: string | null;
  initialProofUrl?: string | null;
  onProofChanged?: () => void;
  className?: string;
}) {
  const apiFetch = useDormitoryApiFetch();
  const { paper } = useAppSlipPaperSize(defaultPaperSize);
  const fileRef = useRef<HTMLInputElement>(null);
  const lb = useAppImageLightbox();

  const [proofUrl, setProofUrl] = useState(initialProofUrl ?? null);
  const [busy, setBusy] = useState<"print" | "pdf" | "upload" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setProofUrl(initialProofUrl ?? null);
  }, [initialProofUrl, paymentId]);

  const loadSheet = useCallback(async () => {
    const res = await apiFetch(`/api/dorm/payments/${paymentId}/invoice-sheet`);
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      sheet?: Parameters<typeof sheetFromDto>[0];
    };
    if (!res.ok || !j.sheet) throw new Error(j.error || "โหลดใบแจ้งหนี้ไม่สำเร็จ");
    return sheetFromDto(j.sheet);
  }, [apiFetch, paymentId]);

  const onPrint = useCallback(async () => {
    setErr(null);
    setBusy("print");
    try {
      const sheet = await loadSheet();
      const ok = printDormInvoice(sheet, paper);
      if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัป");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "พิมพ์ไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }, [loadSheet, paper]);

  const onDownload = useCallback(async () => {
    setErr(null);
    setBusy("pdf");
    try {
      const sheet = await loadSheet();
      await downloadDormInvoicePdfFromCleanHtml(
        sheet,
        safeDormInvoicePdfFileName(sheet.roomNumber, sheet.periodMonth),
        `ใบแจ้งหนี้ ห้อง ${sheet.roomNumber}`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }, [loadSheet]);

  const onUploadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      setErr(null);
      setBusy("upload");
      try {
        const fd = new FormData();
        fd.set("file", f);
        const res = await apiFetch(`/api/dorm/payments/${paymentId}/proof`, { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { proofSlipUrl?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
        if (data.proofSlipUrl) setProofUrl(data.proofSlipUrl);
        onProofChanged?.();
      } catch (uploadErr) {
        setErr(uploadErr instanceof Error ? uploadErr.message : "อัปโหลดไม่สำเร็จ");
      } finally {
        setBusy(null);
      }
    },
    [apiFetch, paymentId, onProofChanged],
  );

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          className={iconBtnClass}
          aria-label="พิมพ์ใบแจ้งหนี้"
          title="พิมพ์ใบแจ้งหนี้"
          disabled={busy != null}
          onClick={() => void onPrint()}
        >
          <IconPrint className={cn("h-4 w-4", busy === "print" && "animate-pulse")} />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          aria-label="ดาวน์โหลด PDF ใบแจ้งหนี้"
          title="ดาวน์โหลด PDF"
          disabled={busy != null}
          onClick={() => void onDownload()}
        >
          <IconDownload className={cn("h-4 w-4", busy === "pdf" && "animate-pulse")} />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          aria-label="อัปโหลดสลิปโอนเงิน"
          title="อัปโหลดสลิป"
          disabled={busy != null}
          onClick={() => fileRef.current?.click()}
        >
          <IconUpload className={cn("h-4 w-4", busy === "upload" && "animate-pulse")} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onUploadFile}
        />
        <button
          type="button"
          className={cn(iconBtnClass, !proofUrl && "opacity-45")}
          aria-label={proofUrl ? "ดูสลิปโอนเงิน" : "ยังไม่มีสลิป"}
          title={proofUrl ? "ดูสลิป" : "ยังไม่มีสลิป"}
          disabled={!proofUrl || busy != null}
          onClick={() => proofUrl && lb.open(proofUrl)}
        >
          <IconViewSlip className="h-4 w-4" />
        </button>
      </div>
      {err ? <p className="max-w-[220px] text-right text-[10px] font-medium text-rose-600">{err}</p> : null}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปโอนเงิน" />
    </div>
  );
}

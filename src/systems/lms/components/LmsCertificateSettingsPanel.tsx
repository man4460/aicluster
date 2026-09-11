"use client";

import { useEffect, useRef, useState } from "react";
import { prepareImageFileForUpload } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  buildLmsCertificatePreviewInput,
  downloadLmsCertificatePdf,
} from "@/systems/lms/lib/lms-certificate-capture";
import {
  buildLmsCertificateDocumentHtml,
  LMS_CERT_PX,
} from "@/systems/lms/lib/lms-certificate-html";
import {
  lmsFieldClass,
  lmsOutlineButtonClass,
  lmsPrimaryButtonClass,
} from "@/systems/lms/lib/ui-tokens";

const SIGNATURE_UPLOAD = "/api/lms/session/images/upload";

export type LmsCertificateSettingsValue = {
  displayName: string;
  slug: string;
  logoUrl: string | null;
  certSignerName: string;
  certSignerTitle: string;
  certSignatureUrl: string | null;
  certTemplateNote: string;
};

type Props = {
  value: LmsCertificateSettingsValue;
  onChange: (patch: Partial<LmsCertificateSettingsValue>) => void;
  notice: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
  trialExportBlocked?: boolean;
};

const rowBtn =
  "cw-btn cw-btn-stack inline-flex min-h-9 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold leading-tight touch-manipulation sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs";

/** พรีวิว HTML จริง (ไม่พึ่ง html2canvas) — เห็นลวดลายทันที */
function LmsCertLivePreview({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / LMS_CERT_PX.width);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-xl bg-white shadow-md sm:rounded-2xl sm:shadow-lg"
      style={{ height: Math.max(120, Math.round(LMS_CERT_PX.height * scale)) }}
    >
      <iframe
        title="พรีวิวใบประกาศนียบัตร"
        srcDoc={html}
        className="pointer-events-none absolute left-0 top-0 border-0"
        style={{
          width: LMS_CERT_PX.width,
          height: LMS_CERT_PX.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

/**
 * ตั้งค่าใบประกาศ + พรีวิวสด (iframe HTML — ไม่ใช้ภาพขาวจาก html2canvas)
 */
export function LmsCertificateSettingsPanel({
  value,
  onChange,
  notice,
  trialExportBlocked = false,
}: Props) {
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    if (!previewVisible) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setPreviewBusy(true);
        setPreviewError(null);
        try {
          const input = await buildLmsCertificatePreviewInput({
            instituteName: value.displayName,
            slug: value.slug || "preview",
            logoUrl: value.logoUrl,
            signerName: value.certSignerName,
            signerTitle: value.certSignerTitle,
            signatureUrl: value.certSignatureUrl,
            note: value.certTemplateNote,
          });
          const html = buildLmsCertificateDocumentHtml(input);
          if (!cancelled) setPreviewHtml(html);
        } catch (e) {
          console.error("[LmsCertificateSettingsPanel preview]", e);
          if (!cancelled) {
            setPreviewHtml(null);
            setPreviewError("สร้างพรีวิวไม่สำเร็จ — กดรีเฟรชอีกครั้ง");
            notice.error("สร้างพรีวิวไม่สำเร็จ — กดรีเฟรชอีกครั้ง");
          }
        } finally {
          if (!cancelled) setPreviewBusy(false);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // notice ไม่ใส่ deps — กัน loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewVisible,
    previewTick,
    value.displayName,
    value.slug,
    value.logoUrl,
    value.certSignerName,
    value.certSignerTitle,
    value.certSignatureUrl,
    value.certTemplateNote,
  ]);

  useEffect(() => {
    setPreviewTick((n) => n + 1);
  }, []);

  async function uploadSignature(file: File) {
    setUploadBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await fetch(SIGNATURE_UPLOAD, { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !json.imageUrl) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      onChange({ certSignatureUrl: json.imageUrl });
      notice.success("อัปโหลดลายเซ็นแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadBusy(false);
    }
  }

  async function downloadSample() {
    if (trialExportBlocked) {
      notice.error("บัญชีทดลองดาวน์โหลดตัวอย่างไม่ได้");
      return;
    }
    setDlBusy(true);
    try {
      const input = await buildLmsCertificatePreviewInput({
        instituteName: value.displayName,
        slug: value.slug || "preview",
        logoUrl: value.logoUrl,
        signerName: value.certSignerName,
        signerTitle: value.certSignerTitle,
        signatureUrl: value.certSignatureUrl,
        note: value.certTemplateNote,
      });
      await downloadLmsCertificatePdf(input, `lms-certificate-preview-${value.slug || "sample"}.pdf`);
      notice.success("ดาวน์โหลดตัวอย่างใบประกาศแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "สร้างตัวอย่างไม่สำเร็จ");
    } finally {
      setDlBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 sm:p-4">
        <p className="text-xs font-black text-[#4d47b6]">ข้อมูลบนใบประกาศ</p>
        <p className="text-[11px] text-slate-500 sm:text-xs">
          โลโก้ใช้จากแท็บตั้งค่าพื้นฐาน · ปรับชื่อผู้ลงนาม ตำแหน่ง และลายเซ็นด้านล่าง
        </p>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">ชื่อผู้ลงนาม</span>
          <input
            className={lmsFieldClass}
            value={value.certSignerName}
            placeholder={value.displayName || "ชื่อผู้ลงนาม"}
            onChange={(e) => onChange({ certSignerName: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">ตำแหน่งผู้ลงนาม</span>
          <input
            className={lmsFieldClass}
            value={value.certSignerTitle}
            placeholder="ผู้ออกใบประกาศ"
            onChange={(e) => onChange({ certSignerTitle: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุท้ายใบ (ไม่บังคับ)</span>
          <textarea
            className={cn(lmsFieldClass, "h-auto min-h-[72px] py-2")}
            rows={2}
            value={value.certTemplateNote}
            placeholder="เช่น ออกโดยสถาบัน…"
            onChange={(e) => onChange({ certTemplateNote: e.target.value })}
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-bold text-[#4d47b6]">รูปลายเซ็น</p>
          {value.certSignatureUrl ? (
            <div className="flex flex-wrap items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.certSignatureUrl}
                alt="ลายเซ็น"
                className="h-16 max-w-[200px] rounded-lg border border-white bg-white object-contain p-1 shadow-sm"
              />
              <button
                type="button"
                className={cn(lmsOutlineButtonClass, "text-rose-700")}
                onClick={() => onChange({ certSignatureUrl: null })}
              >
                ลบลายเซ็น
              </button>
            </div>
          ) : null}
          <label className={cn(lmsOutlineButtonClass, "cursor-pointer", uploadBusy && "opacity-60")}>
            {uploadBusy ? "กำลังอัปโหลด…" : value.certSignatureUrl ? "เปลี่ยนรูปลายเซ็น" : "อัปโหลดรูปลายเซ็น"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadSignature(file);
              }}
            />
          </label>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[560px] space-y-2.5 sm:max-w-[640px]">
        <p className="text-center text-xs font-black text-[#4d47b6]">พรีวิวใบประกาศ (A4 แนวนอน)</p>

        {previewVisible ? (
          <div
            id="lms-cert-preview"
            className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/80 p-2 sm:rounded-2xl sm:border-white/50 sm:bg-white/30 sm:p-3 sm:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] sm:backdrop-blur-md"
          >
            {previewHtml ? (
              <LmsCertLivePreview html={previewHtml} />
            ) : (
              <div className="mx-auto flex min-h-[160px] max-w-[min(96vw,560px)] items-center justify-center rounded-xl border border-slate-200/90 bg-white px-3 text-center text-[11px] font-medium text-slate-600 sm:min-h-[200px] sm:rounded-2xl sm:text-xs">
                {previewBusy
                  ? "กำลังสร้างพรีวิว…"
                  : previewError || "ยังไม่มีพรีวิว — กดรีเฟรช"}
              </div>
            )}
          </div>
        ) : null}

        <div
          role="toolbar"
          aria-label="การจัดการพรีวิวใบประกาศ"
          className="flex w-full flex-nowrap items-stretch gap-1.5"
        >
          <button
            type="button"
            aria-label="รีเฟรชพรีวิว"
            title="รีเฟรช"
            disabled={previewBusy || !previewVisible}
            onClick={() => {
              setPreviewHtml(null);
              setPreviewTick((n) => n + 1);
            }}
            className={cn(rowBtn, "app-btn-soft text-[#4d47b6] shadow-sm ring-1 ring-white/40 disabled:opacity-50")}
          >
            <svg className={cn("cw-btn-icon h-4 w-4 shrink-0", previewBusy && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 12a9 9 0 1 1-2.6-6.3" />
              <path d="M21 3v6h-6" />
            </svg>
            <span className="cw-btn-label truncate">รีเฟรช</span>
          </button>
          <button
            type="button"
            aria-label={trialExportBlocked ? "ดาวน์โหลดถูกบล็อกในบัญชีทดลอง" : "ดาวน์โหลดตัวอย่าง PDF"}
            title="ดาวน์โหลด"
            disabled={dlBusy || trialExportBlocked}
            onClick={() => void downloadSample()}
            className={cn(rowBtn, lmsPrimaryButtonClass, "disabled:opacity-50")}
          >
            <svg className="cw-btn-icon h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span className="cw-btn-label truncate">{dlBusy ? "…" : "ดาวน์โหลด"}</span>
          </button>
          <button
            type="button"
            aria-label={previewVisible ? "ซ่อนพรีวิว" : "แสดงพรีวิว"}
            title={previewVisible ? "ซ่อน" : "แสดง"}
            onClick={() => setPreviewVisible((v) => !v)}
            className={cn(rowBtn, "app-btn-soft text-[#4d47b6] shadow-sm ring-1 ring-white/40")}
          >
            <svg className="cw-btn-icon h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {previewVisible ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="m1 1 22 22" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
            <span className="cw-btn-label truncate">{previewVisible ? "ซ่อน" : "แสดง"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

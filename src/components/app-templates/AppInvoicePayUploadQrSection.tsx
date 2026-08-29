"use client";

import { cn } from "@/lib/cn";

export type AppInvoicePayUploadQrSectionProps = {
  className?: string;
  amountLabel: string;
  promptPayQrDataUrl?: string | null;
  slipUploadQrDataUrl?: string | null;
  missingPromptPayMessage: string;
  payTitle?: string;
  uploadTitle?: string;
  uploadSteps: string[];
};

/**
 * พรีวิวใบแจ้งหนี้บนจอ: ซ้าย QR จ่าย (ใหญ่) · ขวา QR อัปโหลด (เล็ก) + วิธีอัปโหลด
 */
export function AppInvoicePayUploadQrSection({
  className,
  amountLabel,
  promptPayQrDataUrl,
  slipUploadQrDataUrl,
  missingPromptPayMessage,
  payTitle = "สแกนจ่าย พร้อมเพย์",
  uploadTitle = "อัปโหลดสลิป",
  uploadSteps,
}: AppInvoicePayUploadQrSectionProps) {
  return (
    <section
      className={cn(
        "mt-6 border-t border-dashed border-slate-200 pt-6 sm:mt-7 sm:pt-7",
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-[1.15] flex-col items-center text-center">
          <h2 className="text-[10px] font-bold tracking-[0.12em] text-slate-600">{payTitle}</h2>
          {promptPayQrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL จากเซิร์ฟเวอร์ */}
              <img
                src={promptPayQrDataUrl}
                alt="PromptPay QR"
                className="mt-3 h-auto w-[min(100%,220px)] max-w-[220px] object-contain sm:mt-4 sm:w-56 sm:max-w-[224px]"
              />
              <p className="mt-2 text-[11px] font-semibold text-slate-500">ยอด {amountLabel} บาท</p>
            </>
          ) : (
            <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-amber-900 sm:text-sm">
              {missingPromptPayMessage}
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-4 sm:px-4 sm:py-4">
          <h2 className="text-center text-[10px] font-bold tracking-[0.12em] text-slate-500 sm:text-left">
            {uploadTitle}
          </h2>
          <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
            {slipUploadQrDataUrl ? (
              <div className="flex shrink-0 flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL จากเซิร์ฟเวอร์ */}
                <img
                  src={slipUploadQrDataUrl}
                  alt="สแกนอัปโหลดสลิป"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-lg border border-white bg-white object-contain p-1 shadow-sm"
                />
                <p className="mt-1.5 text-center text-[10px] font-bold text-slate-600">สแกนอัปโหลด</p>
              </div>
            ) : (
              <p className="text-center text-[11px] text-slate-400 sm:text-left">(ยังไม่มี QR แนบสลิป)</p>
            )}
            <ol className="min-w-0 flex-1 space-y-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
              {uploadSteps.map((step, i) => (
                <li key={`${i}-${step.slice(0, 24)}`} className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useMemo } from "react";
import {
  AppSlipPaperSizeToolbar,
  appTemplateOutlineButtonClass,
  buildAppReceiptSlipInnerHtml,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  dormReceiptSlipBuildParams,
  printDormReceipt,
  type DormReceiptPrintInput,
} from "@/systems/dormitory/lib/dorm-receipt-print";

export function DormReceiptPageClient({
  data,
  defaultPaperSize,
}: {
  data: DormReceiptPrintInput;
  defaultPaperSize: string;
}) {
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);

  const previewHtml = useMemo(
    () => buildAppReceiptSlipInnerHtml(dormReceiptSlipBuildParams(data, paper)),
    [data, paper],
  );

  const onPrint = useCallback(() => {
    printDormReceipt(data, paper);
  }, [data, paper]);

  const previewWidthClass =
    paper === "A4" ? "max-w-[210mm]" : paper === "SLIP_80" ? "max-w-[80mm]" : "max-w-[58mm]";

  return (
    <>
      <div className="no-print mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <AppSlipPaperSizeToolbar
            value={paper}
            onChange={setPaper}
            sizes={["SLIP_58", "SLIP_80", "A4"]}
            aria-label="ขนาดกระดาษใบเสร็จ"
          />
          <button type="button" className={appTemplateOutlineButtonClass} onClick={onPrint}>
            พิมพ์ใบเสร็จ
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          เลือกขนาดกระดาษแล้วกดพิมพ์ — 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย (มาตรฐานเดียวกับ POS / โรงแรม)
        </p>
      </div>
      <div
        className={cn(
          "mx-auto rounded-xl border border-slate-200 bg-white shadow-sm",
          previewWidthClass,
        )}
      >
        <div
          className="overflow-hidden p-2 sm:p-3"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </>
  );
}

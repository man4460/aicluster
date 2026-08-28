"use client";

import { useCallback, useMemo, useState } from "react";
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
import {
  DormPaymentPrintModal,
  type DormPaymentPrintSource,
} from "@/systems/dormitory/components/DormPaymentPrintModal";

export function DormReceiptPageClient({
  data,
  defaultPaperSize,
  paymentSource,
}: {
  data: DormReceiptPrintInput;
  defaultPaperSize: string;
  paymentSource?: DormPaymentPrintSource | null;
}) {
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const previewHtml = useMemo(
    () => buildAppReceiptSlipInnerHtml(dormReceiptSlipBuildParams(data, paper)),
    [data, paper],
  );

  const onPrint = useCallback(() => {
    printDormReceipt(data, paper);
  }, [data, paper]);

  const previewWidthClass =
    paper === "A4" ? "max-w-[210mm]" : paper === "SLIP_80" ? "max-w-[80mm]" : "max-w-[58mm]";

  const previewOuterClass = paper === "A4" ? "" : "flex justify-center px-2 sm:px-4";

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
          {paymentSource ? (
            <button
              type="button"
              className={appTemplateOutlineButtonClass}
              onClick={() => setPrintModalOpen(true)}
            >
              พิมพ์ใบกำกับภาษี…
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          เลือกขนาดกระดาษแล้วกดพิมพ์ — 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย (มาตรฐานเดียวกับ POS / โรงแรม)
        </p>
      </div>
      <div className={previewOuterClass}>
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
      </div>

      {paymentSource ? (
        <DormPaymentPrintModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          defaultPaperSize={defaultPaperSize}
          brand={{
            dormTitle: data.dormTitle,
            logoUrl: data.logoUrl,
            taxId: data.taxId,
            address: data.address,
            caretakerPhone: data.caretakerPhone,
          }}
          payment={paymentSource}
        />
      ) : null}
    </>
  );
}

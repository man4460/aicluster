"use client";

import { useCallback } from "react";
import {
  AppSlipPaperSizeToolbar,
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  printDormReceipt,
  type DormReceiptPrintInput,
} from "@/systems/dormitory/lib/dorm-receipt-print";

export function DormReceiptPrintToolbar({
  data,
  defaultPaperSize,
  className,
  printLabel = "พิมพ์",
}: {
  data: DormReceiptPrintInput;
  defaultPaperSize?: string | null;
  className?: string;
  printLabel?: string;
}) {
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);

  const onPrint = useCallback(() => {
    printDormReceipt(data, paper);
  }, [data, paper]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AppSlipPaperSizeToolbar
        value={paper}
        onChange={setPaper}
        sizes={["SLIP_58", "SLIP_80", "A4"]}
        aria-label="ขนาดกระดาษใบเสร็จ"
      />
      <button type="button" className={appTemplateOutlineButtonClass} onClick={onPrint}>
        {printLabel}
      </button>
    </div>
  );
}

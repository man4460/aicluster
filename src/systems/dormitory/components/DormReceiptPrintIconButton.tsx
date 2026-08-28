"use client";

import { AppSlipPrintIconButton, useAppSlipPaperSize } from "@/components/app-templates";
import {
  printDormReceipt,
  type DormReceiptPrintInput,
} from "@/systems/dormitory/lib/dorm-receipt-print";

export function DormReceiptPrintIconButton({
  data,
  defaultPaperSize,
  className,
}: {
  data: DormReceiptPrintInput;
  defaultPaperSize?: string | null;
  className?: string;
}) {
  const { paper } = useAppSlipPaperSize(defaultPaperSize);

  return (
    <AppSlipPrintIconButton
      className={className}
      aria-label={`พิมพ์ใบเสร็จ ${data.tenantName}`}
      title="พิมพ์ใบเสร็จ (ขนาดตามตั้งค่าหอพัก)"
      onClick={() => printDormReceipt(data, paper)}
    />
  );
}

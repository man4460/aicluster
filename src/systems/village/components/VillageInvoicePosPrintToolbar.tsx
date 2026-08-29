"use client";

import { useCallback, useState } from "react";
import {
  AppSlipPaperSizeToolbar,
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  downloadVillageInvoicePdf,
  printVillageInvoice,
} from "@/systems/village/village-invoice-print";
import type { VillageInvoicePrintPayload } from "@/systems/village/village-invoice-print-html";

export function VillageInvoicePosPrintToolbar({
  sheet,
  defaultPaperSize,
  className,
  showPdf = true,
}: {
  sheet: VillageInvoicePrintPayload;
  defaultPaperSize?: string | null;
  className?: string;
  showPdf?: boolean;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);

  const onPrint = useCallback(() => {
    const ok = printVillageInvoice(sheet, paper);
    if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF");
  }, [sheet, paper]);

  const onPdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      await downloadVillageInvoicePdf(sheet);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ");
    } finally {
      setPdfBusy(false);
    }
  }, [sheet]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AppSlipPaperSizeToolbar
        value={paper}
        onChange={setPaper}
        sizes={["SLIP_58", "SLIP_80", "A4"]}
        aria-label="ขนาดกระดาษใบแจ้งหนี้"
      />
      <button type="button" className={appTemplateOutlineButtonClass} onClick={onPrint}>
        พิมพ์
      </button>
      {showPdf ? (
        <button
          type="button"
          className={shopQrTemplateGridPrimaryButtonClass}
          disabled={pdfBusy}
          onClick={() => void onPdf()}
        >
          {pdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
        </button>
      ) : null}
      <p className="basis-full text-[11px] leading-snug text-slate-500">
        รูปแบบเดียวกับใบเสร็จ — 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย
      </p>
    </div>
  );
}

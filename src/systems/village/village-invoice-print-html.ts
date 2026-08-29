/** HTML ใบแจ้งหนี้ค่าส่วนกลางหมู่บ้าน — เลย์เอาต์เดียวกับใบเสร็จแต่ละขนาด + บล็อกชำระ/QR */

import {
  buildAppReceiptSlipInnerHtml,
  escapeSlipHtml,
  resolveAppSlipPaperSize,
  type AppReceiptSlipBuildParams,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { formatPeriodMonthLabelStable } from "@/lib/village/format-display-stable";

export type VillageInvoicePrintPayload = {
  villageName: string;
  taxId?: string | null;
  address: string | null;
  contactPhone: string | null;
  houseNo: string;
  residentName: string;
  residentPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
};

/** @deprecated เลย์เอาต์ตามขนาดกระดาษจาก `paper` แล้ว — คงไว้เพื่อ caller เก่า */
export type VillageInvoicePrintLayout = "slip" | "a4Preview";

export function villageInvoiceSlipBuildParams(
  p: VillageInvoicePrintPayload,
  paper?: AppSlipPaperSize | string | null,
): AppReceiptSlipBuildParams {
  const periodLabel = formatPeriodMonthLabelStable(p.periodMonth);
  const amount = Math.round(p.amount * 100) / 100;
  const phoneNote =
    p.residentPhone?.trim() && p.residentPhone.trim() !== "—" ? p.residentPhone.trim() : "";
  return {
    shopLabel: p.villageName,
    taxId: p.taxId,
    address: p.address,
    contactPhone: p.contactPhone,
    subtitle: "ใบแจ้งหนี้ค่าส่วนกลาง",
    printedAt: new Date().toISOString(),
    customerName: p.residentName,
    items: [
      {
        name: `ค่าส่วนกลาง บ้าน ${p.houseNo}`,
        qty: 1,
        unitPrice: amount,
        note: [`งวด ${periodLabel} (${p.periodMonth})`, phoneNote ? `โทร. ${phoneNote}` : null]
          .filter(Boolean)
          .join(" · "),
      },
    ],
    grandTotal: amount,
    paymentMethodLabel: "รอชำระ",
    footerNote: "กรุณาชำระตามช่องทางด้านล่าง",
    signerCustomerLabel: p.residentName,
    signerShopLabel: p.villageName,
    paper,
  };
}

function bankLinesHtml(p: VillageInvoicePrintPayload): string {
  return [
    p.bankName?.trim()
      ? `<p style="margin:0 0 4px;"><span style="color:#64748b;">ธนาคาร </span><strong>${escapeSlipHtml(p.bankName.trim())}</strong></p>`
      : "",
    p.bankAccountNumber?.trim()
      ? `<p style="margin:0 0 4px;"><span style="color:#64748b;">เลขบัญชี </span><strong style="font-variant-numeric:tabular-nums;">${escapeSlipHtml(p.bankAccountNumber.trim())}</strong></p>`
      : "",
    p.bankAccountName?.trim()
      ? `<p style="margin:0;"><span style="color:#64748b;">ชื่อบัญชี </span><strong>${escapeSlipHtml(p.bankAccountName.trim())}</strong></p>`
      : "",
  ]
    .filter(Boolean)
    .join("");
}

function buildVillageInvoicePaymentExtrasHtml(
  p: VillageInvoicePrintPayload,
  paper: AppSlipPaperSize,
): string {
  const centered = paper === "SLIP_58";
  const align = centered ? "center" : "left";
  const amt = Math.round(p.amount * 100) / 100;
  const amtLabel = amt.toLocaleString("th-TH");
  const hasBank = Boolean(p.bankName?.trim() || p.bankAccountNumber?.trim() || p.bankAccountName?.trim());
  const bankLines = bankLinesHtml(p);

  const channels =
    hasBank || p.paymentChannelsNote?.trim()
      ? `<section style="margin-top:12px;text-align:${align};">
<h2 style="margin:0 0 4px;font-size:0.85em;color:#64748b;${centered ? "text-align:center;" : ""}">ช่องทางชำระเงิน</h2>
${hasBank ? `<div style="font-size:0.95em;line-height:1.45;color:#1e293b;${centered ? "text-align:center;" : ""}">${bankLines}</div>` : ""}
${
  p.paymentChannelsNote?.trim()
    ? `<p style="margin:${hasBank ? "8px" : "0"} 0 0;white-space:pre-wrap;font-size:0.95em;color:#1e293b;${centered ? "text-align:center;" : ""}">${escapeSlipHtml(p.paymentChannelsNote.trim())}</p>`
    : ""
}
</section>`
      : `<p style="margin-top:10px;font-size:0.85em;color:#64748b;text-align:${align};">(ตั้งค่าบัญชีโอนได้ที่ตั้งค่าโครงการ → ชำระเงิน)</p>`;

  const qrSize = paper === "A4" ? 200 : paper === "SLIP_80" ? 140 : 120;

  const ppBlock =
    p.promptPayQrDataUrl ?
      `<section class="qr-wrap">
<h2 style="margin:0 0 6px;text-align:center;font-size:0.95em;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeSlipHtml(p.promptPayQrDataUrl)}" alt="PromptPay QR" style="width:${qrSize}px;height:${qrSize}px;max-width:100%;object-fit:contain;" />
<p style="margin:6px 0 0;text-align:center;color:#64748b;font-size:0.85em;">ยอด ${escapeSlipHtml(amtLabel)} บาท</p>
</section>`
    : `<p style="margin-top:10px;padding-top:8px;border-top:1px dashed #cbd5e1;text-align:center;color:#92400e;font-size:0.85em;">ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งค่าได้ที่ตั้งค่าโครงการ → ชำระเงิน</p>`;

  const stepsIntro = centered
    ? `<h2 style="margin:0 0 8px;text-align:center;font-size:0.8em;color:#64748b;">หลังโอนแล้ว — แนบสลิป</h2>
<ol style="margin:0;padding-left:1.1em;text-align:left;font-size:0.9em;line-height:1.5;color:#334155;">
<li>โอนเงินตามช่องทางให้ครบยอด</li>
<li>สแกน QR แนบสลิปด้านล่าง หรือขอลิงก์จากนิติบุคคล</li>
<li>นิติบุคคลตรวจสลิปที่ค่าส่วนกลางแล้วกดอนุมัติ</li>
</ol>`
    : `<h2 style="margin:0 0 8px;font-size:0.85em;color:#64748b;">หลังโอนแล้ว — แนบสลิป</h2>
<ol style="margin:0;padding-left:1.2em;font-size:0.9em;line-height:1.5;color:#334155;">
<li>โอนเงินตามช่องทางด้านบนให้ครบยอด</li>
<li>สแกน QR เพื่ออัปโหลดสลิป หรือขอลิงก์จากนิติบุคคล</li>
<li>นิติบุคคลตรวจสลิปที่ค่าส่วนกลาง แล้วกดอนุมัติ</li>
</ol>`;

  const uploadQr =
    p.slipUploadQrDataUrl ?
      `<div style="text-align:center;margin-top:10px;">
<img src="${escapeSlipHtml(p.slipUploadQrDataUrl)}" alt="สแกนแนบสลิป" style="width:112px;height:112px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;background:#fff;" />
<p style="margin:6px 0 0;font-size:0.75em;font-weight:700;color:#475569;">สแกนแนบสลิป</p>
</div>`
    : "";

  const steps = `<section style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
${stepsIntro}
${uploadQr}
</section>`;

  const footer = `<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.75em;">MAWELL — ระบบจัดการหมู่บ้าน</p>`;

  return `
${channels}
${ppBlock}
${steps}
${footer}
`;
}

/**
 * ใบแจ้งหนี้ — ตัวเอกสารหลักเหมือนใบเสร็จ (58 กึ่งกลาง · 80/A4 ชิดซ้าย)
 * แล้วต่อด้วยช่องทางชำระ · PromptPay · แนบสลิป
 */
export function buildVillageInvoiceInnerHtml(
  p: VillageInvoicePrintPayload,
  _layout: VillageInvoicePrintLayout = "slip",
  paper?: AppSlipPaperSize | string | null,
): string {
  const resolved =
    paper != null && String(paper).trim() !== ""
      ? resolveAppSlipPaperSize(paper)
      : _layout === "a4Preview"
        ? ("A4" as const)
        : resolveAppSlipPaperSize(paper);
  const receiptBody = buildAppReceiptSlipInnerHtml(villageInvoiceSlipBuildParams(p, resolved));
  const extras = buildVillageInvoicePaymentExtrasHtml(p, resolved);
  return `${receiptBody}${extras}`;
}

/** รวมหลายใบ — แต่ละใบขึ้นหน้าใหม่ตอนพิมพ์ */
export function buildVillageInvoicesBatchInnerHtml(
  sheets: VillageInvoicePrintPayload[],
  paper?: AppSlipPaperSize | string | null,
): string {
  if (sheets.length === 0) return "";
  const resolved = resolveAppSlipPaperSize(paper);
  return sheets
    .map((sheet, index) => {
      const breakAfter =
        index < sheets.length - 1 ? "page-break-after:always;break-after:page;" : "";
      return `<div class="village-invoice-page" style="${breakAfter}">${buildVillageInvoiceInnerHtml(sheet, "slip", resolved)}</div>`;
    })
    .join("\n");
}

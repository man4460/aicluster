/** HTML ใบแจ้งหนี้หอพัก — เลย์เอาต์เดียวกับใบเสร็จแต่ละขนาด + บล็อกชำระ/QR */

import {
  buildAppReceiptSlipInnerHtml,
  escapeSlipHtml,
  resolveAppSlipPaperSize,
  type AppReceiptSlipBuildParams,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { formatPeriodMonthLabelStable } from "@/lib/dormitory/format-display-stable";

export type DormInvoicePrintPayload = {
  dormName: string;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  roomNumber: string;
  tenantName: string;
  tenantPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote: string | null;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
};

/** @deprecated เลย์เอาต์ตามขนาดกระดาษจาก `paper` แล้ว — คงไว้เพื่อ caller เก่า */
export type DormInvoicePrintLayout = "slip" | "a4Preview";

export function dormInvoiceSlipBuildParams(
  p: DormInvoicePrintPayload,
  paper?: AppSlipPaperSize | string | null,
): AppReceiptSlipBuildParams {
  const periodLabel = formatPeriodMonthLabelStable(p.periodMonth);
  const amount = Math.round(p.amount * 100) / 100;
  const phoneNote = p.tenantPhone?.trim() && p.tenantPhone.trim() !== "—" ? p.tenantPhone.trim() : "";
  return {
    shopLabel: p.dormName,
    logoUrl: p.logoUrl,
    taxId: p.taxId,
    address: p.address,
    contactPhone: p.caretakerPhone,
    subtitle: "ใบแจ้งหนี้ / แจ้งชำระค่าห้อง",
    printedAt: new Date().toISOString(),
    customerName: p.tenantName,
    items: [
      {
        name: `ค่าเช่า / น้ำไฟ ห้อง ${p.roomNumber}`,
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
    signerCustomerLabel: p.tenantName,
    signerShopLabel: p.dormName,
    paper,
  };
}

function buildDormInvoicePaymentExtrasHtml(
  p: DormInvoicePrintPayload,
  paper: AppSlipPaperSize,
): string {
  const centered = paper === "SLIP_58";
  const align = centered ? "center" : "left";
  const amt = Math.round(p.amount * 100) / 100;
  const amtLabel = amt.toLocaleString("th-TH");

  const channels =
    p.paymentChannelsNote?.trim() ?
      `<section style="margin-top:12px;text-align:${align};">
<h2 style="margin:0 0 4px;font-size:0.85em;color:#64748b;${centered ? "text-align:center;" : ""}">ช่องทางชำระเงิน</h2>
<p style="margin:0;white-space:pre-wrap;font-size:0.95em;color:#1e293b;${centered ? "text-align:center;" : ""}">${escapeSlipHtml(p.paymentChannelsNote.trim())}</p>
</section>`
    : `<p style="margin-top:10px;font-size:0.85em;color:#64748b;text-align:${align};">(ตั้งค่าช่องทางโอนได้ที่ตั้งค่าหอพัก)</p>`;

  const qrSize = paper === "A4" ? 200 : paper === "SLIP_80" ? 140 : 120;

  const ppBlock =
    p.promptPayQrDataUrl ?
      `<section class="qr-wrap">
<h2 style="margin:0 0 6px;text-align:center;font-size:0.95em;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeSlipHtml(p.promptPayQrDataUrl)}" alt="PromptPay QR" style="width:${qrSize}px;height:${qrSize}px;max-width:100%;object-fit:contain;" />
<p style="margin:6px 0 0;text-align:center;color:#64748b;font-size:0.85em;">ยอด ${escapeSlipHtml(amtLabel)} บาท</p>
</section>`
    : `<p style="margin-top:10px;padding-top:8px;border-top:1px dashed #cbd5e1;text-align:center;color:#92400e;font-size:0.85em;">ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งค่าได้ที่ตั้งค่าหอพัก</p>`;

  const stepsIntro = centered
    ? `<h2 style="margin:0 0 8px;text-align:center;font-size:0.8em;color:#64748b;">หลังโอนแล้ว — แนบสลิป</h2>
<ol style="margin:0;padding-left:1.1em;text-align:left;font-size:0.9em;line-height:1.5;color:#334155;">
<li>โอนเงินตามช่องทางให้ครบยอด</li>
<li>สแกน QR แนบสลิปด้านล่าง หรือขอลิงก์จากเจ้าของหอ</li>
<li>เจ้าของหอตรวจสลิปที่หน้าห้องแล้วกดรับชำระ</li>
</ol>`
    : `<h2 style="margin:0 0 8px;font-size:0.85em;color:#64748b;">หลังโอนแล้ว — แนบสลิป</h2>
<ol style="margin:0;padding-left:1.2em;font-size:0.9em;line-height:1.5;color:#334155;">
<li>โอนเงินตามช่องทางด้านบนให้ครบยอด</li>
<li>สแกน QR เพื่ออัปโหลดสลิป หรือขอลิงก์จากเจ้าของหอ</li>
<li>เจ้าของหอตรวจสลิปที่หน้าห้อง แล้วกดยืนยันรับชำระ</li>
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

  const footer = `<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.75em;">MAWELL — ระบบจัดการหอพัก</p>`;

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
export function buildDormInvoiceBillInnerHtml(
  p: DormInvoicePrintPayload,
  _layout: DormInvoicePrintLayout = "slip",
  paper?: AppSlipPaperSize | string | null,
): string {
  const resolved =
    paper != null && String(paper).trim() !== ""
      ? resolveAppSlipPaperSize(paper)
      : _layout === "a4Preview"
        ? ("A4" as const)
        : resolveAppSlipPaperSize(paper);
  const receiptBody = buildAppReceiptSlipInnerHtml(dormInvoiceSlipBuildParams(p, resolved));
  const extras = buildDormInvoicePaymentExtrasHtml(p, resolved);
  return `${receiptBody}${extras}`;
}

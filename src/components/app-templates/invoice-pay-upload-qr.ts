/**
 * แถว QR ใบแจ้งหนี้: ซ้าย = จ่ายเงิน (ใหญ่) · ขวา = อัปโหลดสลิป (เล็ก) + วิธีอัปโหลด
 * ใช้ใน HTML พิมพ์ (หอพัก / หมู่บ้าน)
 */

import { escapeSlipHtml, resolveAppSlipPaperSize, type AppSlipPaperSize } from "@/components/app-templates/slip-print";

export type AppInvoicePayUploadQrRowParams = {
  paper?: AppSlipPaperSize | string | null;
  amountLabel: string;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
  /** เมื่อยังไม่มี QR พร้อมเพย์ */
  missingPromptPayMessage: string;
  /** หัวข้อคอลัมน์ซ้าย */
  payTitle?: string;
  /** หัวข้อคอลัมน์ขวา */
  uploadTitle?: string;
  /** ขั้นตอนอัปโหลด (แสดงด้านขวา) */
  uploadSteps: string[];
};

function qrSizes(paper: AppSlipPaperSize): { pay: number; upload: number; sideBySide: boolean } {
  if (paper === "A4") return { pay: 220, upload: 100, sideBySide: true };
  if (paper === "SLIP_80") return { pay: 148, upload: 84, sideBySide: true };
  return { pay: 120, upload: 88, sideBySide: false };
}

function uploadStepsHtml(steps: string[], compact: boolean): string {
  if (steps.length === 0) return "";
  const items = steps
    .map((s, i) => {
      if (compact) {
        return `<li style="margin:0 0 4px;line-height:1.35;">${i + 1}. ${escapeSlipHtml(s)}</li>`;
      }
      return `<li style="display:flex;gap:6px;margin:0 0 6px;align-items:flex-start;line-height:1.4;">
<span style="flex-shrink:0;width:18px;height:18px;border-radius:999px;background:#3730a3;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">${i + 1}</span>
<span>${escapeSlipHtml(s)}</span>
</li>`;
    })
    .join("");
  return compact
    ? `<ol style="margin:8px 0 0;padding-left:1.1em;font-size:0.8em;color:#334155;">${items}</ol>`
    : `<ol style="margin:8px 0 0;padding:0;list-style:none;font-size:0.8em;color:#334155;">${items}</ol>`;
}

/**
 * HTML แถว QR จ่าย (ซ้ายใหญ่) + QR อัปโหลดกับวิธี (ขวาเล็ก)
 * — กระดาษ 80/A4 เรียงคู่ข้าง · 58 mm เรียงบน–ล่าง
 */
export function buildAppInvoicePayUploadQrRowHtml(params: AppInvoicePayUploadQrRowParams): string {
  const paper = resolveAppSlipPaperSize(params.paper);
  const { pay, upload, sideBySide } = qrSizes(paper);
  const payTitle = params.payTitle?.trim() || "สแกนจ่าย พร้อมเพย์";
  const uploadTitle = params.uploadTitle?.trim() || "อัปโหลดสลิป";
  const amt = escapeSlipHtml(params.amountLabel);
  const compact = paper === "SLIP_58";

  const payCol =
    params.promptPayQrDataUrl ?
      `<div style="flex:1.15;min-width:${sideBySide ? "42%" : "0"};text-align:center;">
<h2 style="margin:0 0 8px;font-size:0.9em;font-weight:700;color:#1e293b;">${escapeSlipHtml(payTitle)}</h2>
<img src="${escapeSlipHtml(params.promptPayQrDataUrl)}" alt="PromptPay QR" style="width:${pay}px;height:${pay}px;max-width:100%;object-fit:contain;" />
<p style="margin:8px 0 0;font-size:0.85em;font-weight:600;color:#475569;">ยอด ${amt} บาท</p>
</div>`
    : `<div style="flex:1.15;min-width:${sideBySide ? "42%" : "0"};text-align:center;">
<h2 style="margin:0 0 8px;font-size:0.9em;font-weight:700;color:#1e293b;">${escapeSlipHtml(payTitle)}</h2>
<p style="margin:0;padding:12px 8px;color:#92400e;font-size:0.85em;line-height:1.45;">${escapeSlipHtml(params.missingPromptPayMessage)}</p>
</div>`;

  const uploadQrImg =
    params.slipUploadQrDataUrl ?
      `<img src="${escapeSlipHtml(params.slipUploadQrDataUrl)}" alt="สแกนอัปโหลดสลิป" style="width:${upload}px;height:${upload}px;max-width:100%;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;background:#fff;" />
<p style="margin:6px 0 0;font-size:0.72em;font-weight:700;color:#475569;">สแกนอัปโหลดสลิป</p>`
    : `<p style="margin:0;font-size:0.8em;color:#94a3b8;">(ยังไม่มี QR แนบสลิป)</p>`;

  const uploadCol = `<div style="flex:1;min-width:${sideBySide ? "38%" : "0"};${sideBySide ? "" : "margin-top:14px;padding-top:12px;border-top:1px dashed #cbd5e1;"}text-align:${sideBySide ? "left" : "center"};">
<h2 style="margin:0 0 8px;font-size:0.85em;font-weight:700;color:#1e293b;${sideBySide ? "" : "text-align:center;"}">${escapeSlipHtml(uploadTitle)}</h2>
<div style="text-align:center;">${uploadQrImg}</div>
${uploadStepsHtml(params.uploadSteps, compact)}
</div>`;

  const rowStyle = sideBySide
    ? "display:flex;flex-wrap:wrap;gap:16px 20px;align-items:flex-start;justify-content:space-between;"
    : "display:block;";

  return `<section class="qr-wrap" style="margin-top:14px;padding-top:12px;border-top:1px dashed #cbd5e1;">
<div style="${rowStyle}">
${payCol}
${uploadCol}
</div>
</section>`;
}

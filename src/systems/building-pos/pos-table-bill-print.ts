/**
 * บิลโต๊ะ Building POS — ห่อระบบสลิปกลาง (`app-templates/slip-print`)
 * คง API เดิมเพื่อไม่พังโมดูลที่ import จากที่นี่ (คาร์แคร์ / หอพัก / ยอดขาย)
 */
import {
  appSlipPageAndRootCss,
  buildAppSlipStaticDocumentHtml,
  escapeSlipHtml,
  openAppSlipPrintWindow,
  type AppSlipPaperSize,
  type AppSlipPrintPageOptions,
} from "@/components/app-templates/slip-print";
import type { PosOrder } from "@/systems/building-pos/building-pos-service";

export type PosTablePaperSize = AppSlipPaperSize;
export type PosTablePrintPageOptions = AppSlipPrintPageOptions;

export { escapeSlipHtml as escapeHtml };

export function pageAndRootCss(paper: PosTablePaperSize, opts?: PosTablePrintPageOptions): string {
  return appSlipPageAndRootCss(paper, opts);
}

export function buildPosTableBillInnerHtml(params: {
  shopLabel: string;
  logoUrl: string | null;
  tableLabel: string;
  billPrintedAt: string;
  orders: PosOrder[];
  grandTotal: number;
  paymentChannelsNote: string | null;
  ppQrUrl: string | null;
}): string {
  const {
    shopLabel,
    logoUrl,
    tableLabel,
    billPrintedAt,
    orders,
    grandTotal,
    paymentChannelsNote,
    ppQrUrl,
  } = params;

  const logoBlock =
    logoUrl?.trim() ?
      `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeSlipHtml(logoUrl.trim())}" alt="" style="max-height:48px;max-width:120px;object-fit:contain;" /></div>`
    : "";

  const orderBlocks = orders
    .map((o) => {
      const lines = o.items
        .map(
          (it) =>
            `<div style="display:flex;justify-content:space-between;gap:4px;margin:2px 0;"><span>${escapeSlipHtml(it.name)} × ${it.qty}</span><span style="white-space:nowrap;">฿${(it.price * it.qty).toLocaleString()}</span></div>`,
        )
        .join("");
      return `<div style="border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
<p style="margin:0;font-size:0.85em;color:#64748b;">#${o.id}</p>
${lines}
<p style="margin:4px 0 0;text-align:right;font-weight:600;">รวม ฿${o.total_amount.toLocaleString()}</p>
</div>`;
    })
    .join("");

  const channelsBlock =
    paymentChannelsNote?.trim() ?
      `<section style="margin-top:8px;"><h2 style="font-size:0.9em;">ช่องทางชำระ</h2><p style="margin:0;white-space:pre-wrap;">${escapeSlipHtml(paymentChannelsNote.trim())}</p></section>`
    : "";

  const qrBlock =
    ppQrUrl ?
      `<section class="qr-wrap"><h2 style="text-align:center;font-size:0.95em;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeSlipHtml(ppQrUrl)}" alt="PromptPay QR" />
<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">ยอด ${grandTotal.toLocaleString("th-TH")} บาท</p></section>`
    : `<p style="margin-top:8px;text-align:center;color:#92400e;font-size:0.85em;">ยังไม่มี QR พร้อมเพย์ — ตั้งเบอร์ที่โปรไฟล์</p>`;

  return `
${logoBlock}
<h1>${escapeSlipHtml(shopLabel)}</h1>
<p style="margin:0;text-align:center;font-weight:600;color:#0000bf;">ใบสรุปยอด / ชำระเงิน</p>
<p style="margin:6px 0 0;text-align:center;">โต๊ะ <strong>${escapeSlipHtml(tableLabel)}</strong></p>
<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeSlipHtml(billPrintedAt)}</p>
<div style="margin-top:10px;">${orderBlocks}</div>
<div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;text-align:center;">
<p style="margin:0;font-size:0.85em;color:#475569;">ยอดรวมทั้งหมด (บาท)</p>
<p class="total-big" style="margin:4px 0 0;">${grandTotal.toLocaleString("th-TH")}</p>
</div>
${channelsBlock}
${qrBlock}
<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">ขอบคุณที่ใช้บริการ</p>
`;
}

export function buildPosTableStaticDocumentHtml(
  paper: PosTablePaperSize,
  innerHtml: string,
  documentTitle: string,
  pageOpts?: PosTablePrintPageOptions,
): string {
  return buildAppSlipStaticDocumentHtml(paper, innerHtml, documentTitle, pageOpts, "pos-pdf-root");
}

export function openPosTableBillPrintWindow(
  paper: PosTablePaperSize,
  innerHtml: string,
  documentTitle?: string,
  pageOpts?: PosTablePrintPageOptions,
): boolean {
  return openAppSlipPrintWindow(paper, innerHtml, documentTitle ?? "บิลโต๊ะ", pageOpts);
}

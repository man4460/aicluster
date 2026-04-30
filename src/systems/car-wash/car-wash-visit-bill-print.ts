import type { ServiceVisit } from "@/systems/car-wash/car-wash-service";
import { openPosTableBillPrintWindow, type PosTablePaperSize } from "@/systems/building-pos/pos-table-bill-print";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type { PosTablePaperSize };

/** HTML ภายในสำหรับพิมพ์บิลลานล้าง (โครงเดียวกับบิลโต๊ะ POS — inline style) */
export function buildCarWashVisitBillInnerHtml(params: {
  shopLabel: string;
  logoUrl: string | null;
  plateLabel: string;
  billPrintedAt: string;
  visit: ServiceVisit;
  paymentChannelsNote: string | null;
  ppQrUrl: string | null;
}): string {
  const { shopLabel, logoUrl, plateLabel, billPrintedAt, visit, paymentChannelsNote, ppQrUrl } = params;
  const grandTotal = visit.final_price;

  const logoBlock =
    logoUrl?.trim() ?
      `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeHtml(logoUrl.trim())}" alt="" style="max-height:48px;max-width:120px;object-fit:contain;" /></div>`
    : "";

  const noteBlock =
    visit.note?.trim() ?
      `<p style="margin:6px 0 0;font-size:0.9em;color:#64748b;white-space:pre-wrap;">${escapeHtml(visit.note.trim())}</p>`
    : "";

  const detailBlock = `<div style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:8px;">
<p style="margin:0;font-size:0.85em;color:#64748b;">รายการ #${visit.id}</p>
<p style="margin:4px 0 0;"><strong>ทะเบียน</strong> ${escapeHtml(visit.plate_number.trim() || "—")}</p>
<p style="margin:4px 0 0;"><strong>ลูกค้า</strong> ${escapeHtml(visit.customer_name.trim() || "—")}</p>
<p style="margin:4px 0 0;"><strong>แพ็กเกจ</strong> ${escapeHtml(visit.package_name.trim() || "—")}</p>
${noteBlock}
<p style="margin:8px 0 0;text-align:right;font-weight:600;">ยอดชำระ ฿${grandTotal.toLocaleString("th-TH")}</p>
</div>`;

  const channelsBlock =
    paymentChannelsNote?.trim() ?
      `<section style="margin-top:8px;"><h2 style="font-size:0.9em;">ช่องทางชำระ</h2><p style="margin:0;white-space:pre-wrap;">${escapeHtml(paymentChannelsNote.trim())}</p></section>`
    : "";

  const qrBlock =
    ppQrUrl ?
      `<section class="qr-wrap"><h2 style="text-align:center;font-size:0.95em;">สแกนจ่าย</h2>
<img src="${escapeHtml(ppQrUrl)}" alt="QR ชำระเงิน" />
<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">ยอด ${grandTotal.toLocaleString("th-TH")} บาท</p></section>`
    : `<p style="margin-top:8px;text-align:center;color:#92400e;font-size:0.85em;">ยังไม่มี QR ชำระเงิน — ตั้งเบอร์ที่โปรไฟล์</p>`;

  return `
${logoBlock}
<h1>${escapeHtml(shopLabel)}</h1>
<p style="margin:0;text-align:center;font-weight:600;color:#0000bf;">ใบสรุปยอด / ชำระเงิน (ลานล้างรถ)</p>
<p style="margin:6px 0 0;text-align:center;">ทะเบียน <strong>${escapeHtml(plateLabel)}</strong></p>
<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeHtml(billPrintedAt)}</p>
<div style="margin-top:10px;">${detailBlock}</div>
<div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;text-align:center;">
<p style="margin:0;font-size:0.85em;color:#475569;">ยอดรวม (บาท)</p>
<p class="total-big" style="margin:4px 0 0;">${grandTotal.toLocaleString("th-TH")}</p>
</div>
${channelsBlock}
${qrBlock}
<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">ขอบคุณที่ใช้บริการ</p>
`;
}

export function openCarWashVisitBillPrintWindow(paper: PosTablePaperSize, innerHtml: string): boolean {
  return openPosTableBillPrintWindow(paper, innerHtml);
}

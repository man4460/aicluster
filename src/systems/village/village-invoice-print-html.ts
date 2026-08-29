/** HTML ภายในสำหรับ window.print / PDF — ใบแจ้งหนี้ค่าส่วนกลางหมู่บ้าน */

import { escapeHtml } from "@/systems/building-pos/pos-table-bill-print";
import { formatVillageAmountStable } from "@/lib/village/format-display-stable";

export type VillageInvoicePrintPayload = {
  villageName: string;
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

/** เอกสาร A4 — หัวสองคอลัมน์เหมือนพรีวิวในโมดัล */
export function buildVillageInvoiceInnerHtml(p: VillageInvoicePrintPayload): string {
  const amt = formatVillageAmountStable(p.amount, 2);

  const header = `
<header style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-start;padding-bottom:16px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;">
  <div style="flex:1;min-width:200px;">
    <h1 style="margin:0;font-size:1.125rem;line-height:1.25;font-weight:700;color:#0f172a;">${escapeHtml(p.villageName)}</h1>
    <p style="margin:6px 0 0;font-size:0.75rem;font-weight:600;color:#3730a3;">ใบแจ้งหนี้ค่าส่วนกลาง</p>
  </div>
  <div style="flex:1;min-width:200px;max-width:55%;font-size:0.75rem;line-height:1.45;color:#475569;text-align:right;">
    ${p.address?.trim() ? `<p style="margin:0 0 4px;white-space:pre-wrap;">${escapeHtml(p.address.trim())}</p>` : ""}
    ${p.contactPhone?.trim() ? `<p style="margin:0;font-weight:600;color:#1e293b;">ติดต่อ ${escapeHtml(p.contactPhone.trim())}</p>` : ""}
  </div>
</header>`;

  const houseBlock = `
<section style="margin-top:16px;">
<h2 style="margin:0 0 10px;font-size:0.625rem;font-weight:700;color:#94a3b8;letter-spacing:0.12em;">ข้อมูลบ้าน</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:0.875rem;line-height:1.35;">
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;">บ้าน</div>
    <div style="margin-top:2px;font-weight:600;color:#0f172a;">${escapeHtml(p.houseNo)}</div>
  </div>
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;">เจ้าของ / ผู้อยู่อาศัย</div>
    <div style="margin-top:2px;font-weight:600;color:#0f172a;">${escapeHtml(p.residentName)}</div>
  </div>
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;">เบอร์ติดต่อ</div>
    <div style="margin-top:2px;font-weight:500;word-break:break-all;color:#1e293b;">${escapeHtml(p.residentPhone)}</div>
  </div>
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;">งวด</div>
    <div style="margin-top:2px;font-family:ui-monospace,monospace;font-size:0.875rem;font-weight:600;color:#1e293b;">${escapeHtml(p.periodMonth)}</div>
  </div>
</div>
</section>`;

  const amountBlock = `
<div style="margin-top:18px;padding:16px 18px;text-align:center;border-radius:12px;border:1px solid #e0e7ff;background:linear-gradient(to bottom right,#eef2ff,#ffffff,#f8fafc);">
<p style="margin:0;font-size:0.6875rem;font-weight:600;color:#475569;">ยอดคงเหลือที่ต้องชำระ (บาท)</p>
<p style="margin:6px 0 0;font-size:2rem;font-weight:800;color:#3730a3;">${escapeHtml(amt)}</p>
</div>`;

  const hasBank = Boolean(p.bankName?.trim() || p.bankAccountNumber?.trim() || p.bankAccountName?.trim());
  const bankLines = [
    p.bankName?.trim() ? `<p style="margin:0 0 4px;"><span style="color:#64748b;">ธนาคาร </span><strong>${escapeHtml(p.bankName.trim())}</strong></p>` : "",
    p.bankAccountNumber?.trim()
      ? `<p style="margin:0 0 4px;"><span style="color:#64748b;">เลขบัญชี </span><strong style="font-variant-numeric:tabular-nums;">${escapeHtml(p.bankAccountNumber.trim())}</strong></p>`
      : "",
    p.bankAccountName?.trim()
      ? `<p style="margin:0;"><span style="color:#64748b;">ชื่อบัญชี </span><strong>${escapeHtml(p.bankAccountName.trim())}</strong></p>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const channelsBlock =
    hasBank || p.paymentChannelsNote?.trim()
      ? `<section style="margin-top:18px;">
<h2 style="margin:0 0 8px;font-size:0.625rem;font-weight:700;color:#64748b;letter-spacing:0.12em;">ช่องทางชำระเงิน</h2>
${hasBank ? `<div style="font-size:0.875rem;line-height:1.5;color:#1e293b;">${bankLines}</div>` : ""}
${
  p.paymentChannelsNote?.trim()
    ? `<p style="margin:${hasBank ? "12px" : "0"} 0 0;white-space:pre-wrap;font-size:0.875rem;line-height:1.5;color:#1e293b;">${escapeHtml(p.paymentChannelsNote.trim())}</p>`
    : ""
}
</section>`
      : `<p style="margin-top:12px;font-size:0.8125rem;color:#64748b;">(ตั้งค่าบัญชีโอนได้ที่ตั้งค่าโครงการ → ชำระเงิน)</p>`;

  const ppBlock = p.promptPayQrDataUrl
    ? `<section style="margin-top:24px;padding-top:22px;border-top:1px dashed #cbd5e1;text-align:center;">
<h2 style="margin:0 0 10px;font-size:0.625rem;font-weight:700;color:#475569;letter-spacing:0.12em;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeHtml(p.promptPayQrDataUrl)}" alt="PromptPay QR" style="width:200px;max-width:100%;height:auto;object-fit:contain;" />
<p style="margin:8px 0 0;font-size:0.6875rem;color:#64748b;">ยอด ${escapeHtml(amt)} บาท</p>
</section>`
    : `<p style="margin-top:18px;padding-top:16px;border-top:1px dashed #cbd5e1;text-align:center;color:#92400e;font-size:0.8125rem;line-height:1.45;">ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งค่าได้ที่ตั้งค่าโครงการ → ชำระเงิน</p>`;

  const stepsBlock = `
<section style="margin-top:22px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
<h2 style="margin:0 0 14px;text-align:center;font-size:0.625rem;font-weight:700;color:#64748b;letter-spacing:0.12em;">หลังโอนแล้ว — แนบสลิป</h2>
<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;justify-content:space-between;">
<ol style="flex:1;min-width:220px;margin:0;padding:0;list-style:none;font-size:0.8125rem;line-height:1.45;color:#334155;">
<li style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-start;">
<span style="flex-shrink:0;width:24px;height:24px;border-radius:999px;background:#3730a3;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">1</span>
<span>โอนเงินตามช่องทางด้านบนให้ครบยอด</span>
</li>
<li style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-start;">
<span style="flex-shrink:0;width:24px;height:24px;border-radius:999px;background:#3730a3;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">2</span>
<span>สแกน QR ด้านขวาเพื่ออัปโหลดสลิป หรือขอลิงก์จากนิติบุคคลแล้วเปิดลิงก์แนบรูปสลิป</span>
</li>
<li style="display:flex;gap:8px;align-items:flex-start;">
<span style="flex-shrink:0;width:24px;height:24px;border-radius:999px;background:#3730a3;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">3</span>
<span>นิติบุคคลตรวจสลิปที่หน้าสลิปโอนเงิน แล้วกดอนุมัติรับชำระ</span>
</li>
</ol>
${
  p.slipUploadQrDataUrl
    ? `<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;margin:0 auto;">
<img src="${escapeHtml(p.slipUploadQrDataUrl)}" alt="สแกนแนบสลิป" style="width:112px;height:112px;object-fit:contain;border-radius:8px;border:1px solid #fff;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.06);" />
<p style="margin:6px 0 0;font-size:0.625rem;font-weight:700;color:#475569;">สแกนแนบสลิป</p>
</div>`
    : ""
}
</div>
</section>`;

  const footer = `<p style="margin-top:14px;text-align:center;color:#94a3b8;font-size:0.75em;">MAWELL — ระบบจัดการหมู่บ้าน</p>`;

  return `
${header}
${houseBlock}
${amountBlock}
${channelsBlock}
${ppBlock}
${stepsBlock}
${footer}
`;
}

import { printPrintableHtmlInHiddenIframe } from "@/components/app-templates/openPrintableHtml";

/** ขนาดกระดาษสลิป/บิล — ตั้งค่าต่อโมดูล (`slipPaperSize`) */
export type AppSlipPaperSize = "SLIP_58" | "SLIP_80" | "A4";

/** ค่าเริ่มต้นเมื่อโมดูลยังไม่ตั้งค่า */
export const DEFAULT_APP_SLIP_PAPER_SIZE: AppSlipPaperSize = "SLIP_58";

export const APP_SLIP_PAPER_SIZE_OPTIONS: { value: AppSlipPaperSize; label: string }[] = [
  { value: "SLIP_58", label: "สลิป 58 mm" },
  { value: "SLIP_80", label: "สลิป 80 mm" },
  { value: "A4", label: "A4" },
];

/** แปลงค่าจากโปรไฟล์ / query / API → ขนาดกระดาษมาตรฐาน */
export function parseAppSlipPaperSize(raw: unknown): AppSlipPaperSize {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  if (s === "SLIP_80" || s === "SLIP80" || s === "80") return "SLIP_80";
  if (s === "A4") return "A4";
  if (s === "SLIP_58" || s === "SLIP58" || s === "58") return "SLIP_58";
  return DEFAULT_APP_SLIP_PAPER_SIZE;
}

export function resolveAppSlipPaperSize(
  preferred?: AppSlipPaperSize | string | null,
  fallback: AppSlipPaperSize = DEFAULT_APP_SLIP_PAPER_SIZE,
): AppSlipPaperSize {
  if (preferred == null || preferred === "") return fallback;
  return parseAppSlipPaperSize(preferred);
}

export type AppSlipPrintPageOptions = {
  /** A4: ลด padding แนวตั้งของเนื้อหา (หลังตัดหัวเบราว์เซอร์ด้วย @page margin:0) */
  a4TightVerticalMargins?: boolean;
};

export type AppSlipLineItem = {
  name: string;
  qty: number;
  /** ราคาต่อหน่วย — แสดงเมื่อมีราคา */
  unitPrice?: number;
  /** ส่วนลดต่อบรรทัด (บาท) — ใช้ในเลย์เอาต์ 80mm/A4 */
  discount?: number;
  note?: string;
};

export type AppOrderTicketSlipVariant = "kitchen" | "receipt";

export function escapeSlipHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeDocTitle(title: string): string {
  return title.replace(/[<>"]/g, "");
}

/** CSS หน้ากระดาษสลิป/บิล — แม่แบบเดียวทั้งโปรเจกต์ */
export function appSlipPageAndRootCss(paper: AppSlipPaperSize, opts?: AppSlipPrintPageOptions): string {
  if (paper === "A4") {
    const tight = opts?.a4TightVerticalMargins === true;
    /** margin ของ @page = 0 เพื่อตัดหัว/ท้ายเบราว์เซอร์ (วันที่ · ชื่อเอกสาร) — ระยะขอบย้ายไปที่ .root */
    const padV = tight ? "5mm" : "12mm";
    const padH = tight ? "10mm" : "12mm";
    return `
@page { size: A4 portrait; margin: 0; }
body { margin: 0; font-family: system-ui, "Segoe UI", "Tahoma", sans-serif; color: #0f172a; background: #fff; }
.root { max-width: 190mm; margin: 0 auto; padding: ${padV} ${padH}; box-sizing: border-box; font-size: 12px; line-height: 1.45; text-align: left; }
h1 { font-size: 1.15rem; margin: 0 0 0.25rem; text-align: left; }
h2 { font-size: 0.85rem; margin: 0.75rem 0 0.35rem; }
.total-big { font-size: 1.35rem; font-weight: 800; color: #0f172a; }
.table-big { font-size: 1.85rem; font-weight: 900; text-align: center; letter-spacing: 0.02em; }
.qr-wrap { text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: 200px; height: 200px; object-fit: contain; }
.receipt-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
.receipt-table th, .receipt-table td { border: 1px solid #94a3b8; padding: 5px 6px; vertical-align: top; }
.receipt-table th { background: #e8eef5; font-weight: 700; text-align: center; }
`;
  }
  if (paper === "SLIP_80") {
    return `
@page { size: 80mm auto; margin: 2mm; }
body { margin: 0; font-family: system-ui, "Segoe UI", "Tahoma", sans-serif; color: #0f172a; background: #fff; font-size: 10px; line-height: 1.35; }
.root { width: 74mm; max-width: 100%; margin: 0; box-sizing: border-box; text-align: left; }
h1 { font-size: 1.05em; margin: 0 0 0.15rem; text-align: left; }
h2 { font-size: 0.95em; margin: 0.5rem 0 0.2rem; }
.total-big { font-size: 1.2em; font-weight: 800; color: #0f172a; }
.table-big { font-size: 1.55em; font-weight: 900; text-align: center; letter-spacing: 0.02em; }
.qr-wrap { text-align: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: 140px; height: 140px; object-fit: contain; }
.receipt-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5px; }
.receipt-table th, .receipt-table td { border: 1px solid #94a3b8; padding: 3px 3px; vertical-align: top; }
.receipt-table th { background: #e8eef5; font-weight: 700; text-align: center; }
`;
  }
  return `
@page { size: 58mm auto; margin: 2mm; }
body { margin: 0; font-family: system-ui, "Segoe UI", "Tahoma", sans-serif; color: #0f172a; background: #fff; font-size: 9px; line-height: 1.35; }
.root { width: 52mm; max-width: 100%; margin: 0 auto; box-sizing: border-box; text-align: center; }
h1 { font-size: 1.1em; margin: 0 0 0.15rem; text-align: center; }
h2 { font-size: 0.95em; margin: 0.5rem 0 0.2rem; }
.total-big { font-size: 1.35em; font-weight: 800; color: #0000bf; text-align: center; }
.table-big { font-size: 1.45em; font-weight: 900; text-align: center; letter-spacing: 0.02em; }
.qr-wrap { text-align: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: 120px; height: 120px; object-fit: contain; }
`;
}

function buildPrintDocumentHtml(
  paper: AppSlipPaperSize,
  innerHtml: string,
  afterPrint: "closeWindow" | "none",
  documentTitle: string,
  pageOpts?: AppSlipPrintPageOptions,
): string {
  const css = appSlipPageAndRootCss(paper, pageOpts);
  const after =
    afterPrint === "closeWindow" ?
      "setTimeout(function(){try{window.close();}catch(e){}},400);"
    : "";
  // ต้องใช้ window.onload — addEventListener เปล่า ๆ จะ ReferenceError ในเบราว์เซอร์
  const boot = `window.onload=function(){setTimeout(function(){window.print();${after}},200);};`;
  /** title ว่าง — กันหัวพิมพ์เบราว์เซอร์โชว์ชื่อเอกสาร (คู่กับ @page margin:0 บน A4) */
  const safeTitle = paper === "A4" ? "" : escapeDocTitle(documentTitle);
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>${css}</style></head><body><div class="root">${innerHtml}</div><script>${boot}<\/script></body></html>`;
}

/** เอกสาร HTML นิ่ง (ไม่มีสคริปต์พิมพ์) — ใช้จับภาพ PDF / preview */
export function buildAppSlipStaticDocumentHtml(
  paper: AppSlipPaperSize,
  innerHtml: string,
  documentTitle: string,
  pageOpts?: AppSlipPrintPageOptions,
  rootElementId = "app-slip-pdf-root",
): string {
  const css = appSlipPageAndRootCss(paper, pageOpts);
  const safeTitle = paper === "A4" ? "" : escapeDocTitle(documentTitle);
  const safeId = rootElementId.replace(/[^a-zA-Z0-9_-]/g, "") || "app-slip-pdf-root";
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>${css}</style></head><body><div id="${safeId}" class="root">${innerHtml}</div></body></html>`;
}

/**
 * เปิดหน้าต่างพิมพ์ทันทีตามขนาดกระดาษ
 * ไม่ใส่ noopener ใน window.open — ถ้าใส่ เบราว์เซอร์ใหม่มักคืน null แล้วพิมพ์ไม่ทำงาน
 * หน้าต่างใหม่ใช้สคริปต์ปิดหลังพิมพ์; iframe สำรองใช้เอกสารแยกโดยไม่เรียก window.close
 */
export function openAppSlipPrintWindow(
  paper: AppSlipPaperSize,
  innerHtml: string,
  documentTitle = "สลิป",
  pageOpts?: AppSlipPrintPageOptions,
): boolean {
  const htmlPopup = buildPrintDocumentHtml(paper, innerHtml, "closeWindow", documentTitle, pageOpts);
  const w = window.open("about:blank", "_blank", "width=520,height=720");
  if (w) {
    try {
      w.document.open();
      w.document.write(htmlPopup);
      w.document.close();
      return true;
    } catch {
      try {
        w.close();
      } catch {
        /* ignore */
      }
    }
  }
  const htmlIframe = buildPrintDocumentHtml(paper, innerHtml, "none", documentTitle, pageOpts);
  return printPrintableHtmlInHiddenIframe(htmlIframe);
}

function formatSlipMoney(n: number): string {
  return n.toLocaleString("th-TH");
}

function formatSlipPrintedAt(isoOrLabel: string): string {
  const d = new Date(isoOrLabel);
  if (Number.isNaN(d.getTime())) return isoOrLabel;
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * สลิปออเดอร์กลาง — ครัว/เสิร์ฟ (โต๊ะเด่น + รายการ) หรือใบรับออเดอร์ (มีราคา)
 * โมดูลอื่น map ข้อมูลโดเมนมาที่นี่ แล้วเรียก openAppSlipPrintWindow
 */
export function buildAppOrderTicketSlipInnerHtml(params: {
  shopLabel?: string | null;
  logoUrl?: string | null;
  /** หัวเรื่อง เช่น สลิปครัว · ส่งโต๊ะ · ใบออเดอร์ */
  subtitle: string;
  /**
   * บรรทัดเด่นกลางสลิป — ค่าเริ่มต้น `โต๊ะ {tableLabel}`
   * ใช้ highlightLabel เมื่อต้องการข้อความเต็มเอง (เช่น คิวเครื่องดื่ม)
   */
  tableLabel: string;
  highlightLabel?: string | null;
  orderRef?: string | number | null;
  customerName?: string | null;
  note?: string | null;
  printedAt: string;
  items: AppSlipLineItem[];
  variant?: AppOrderTicketSlipVariant;
  /** รวมยอด — ถ้าไม่ส่งจะคำนวณจาก qty × unitPrice เมื่อมีราคา */
  grandTotal?: number | null;
  footerNote?: string | null;
}): string {
  const variant = params.variant ?? "kitchen";
  const showPrices = variant === "receipt";
  const shop = params.shopLabel?.trim() || "";
  const logoUrl = params.logoUrl?.trim() || "";
  const table = params.tableLabel.trim() || "—";
  const highlight = params.highlightLabel?.trim() || `โต๊ะ ${table}`;
  const customer = params.customerName?.trim() || "";
  const note = params.note?.trim() || "";
  const footer = params.footerNote?.trim() || "";

  const logoBlock =
    logoUrl ?
      `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeSlipHtml(logoUrl)}" alt="" style="max-height:48px;max-width:120px;object-fit:contain;" /></div>`
    : "";

  const shopBlock = shop ? `<h1>${escapeSlipHtml(shop)}</h1>` : "";

  const orderRef =
    params.orderRef != null && String(params.orderRef).trim() ?
      `<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">#${escapeSlipHtml(String(params.orderRef))} · ${escapeSlipHtml(formatSlipPrintedAt(params.printedAt))}</p>`
    : `<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeSlipHtml(formatSlipPrintedAt(params.printedAt))}</p>`;

  const customerBlock =
    customer ?
      `<p style="margin:6px 0 0;text-align:center;font-weight:600;">${escapeSlipHtml(customer)}</p>`
    : "";

  let computedTotal = 0;
  const lines = params.items
    .map((it) => {
      const qty = Math.max(0, Number(it.qty) || 0);
      const unit = typeof it.unitPrice === "number" && Number.isFinite(it.unitPrice) ? it.unitPrice : null;
      const lineTotal = unit != null ? unit * qty : null;
      if (lineTotal != null) computedTotal += lineTotal;
      const noteLine =
        it.note?.trim() ?
          `<div style="margin:0 0 2px 0;color:#64748b;font-size:0.85em;">↳ ${escapeSlipHtml(it.note.trim())}</div>`
        : "";
      if (showPrices && lineTotal != null) {
        return `<div style="margin:3px 0;">
<div style="display:flex;justify-content:space-between;gap:4px;"><span>${escapeSlipHtml(it.name)} × ${qty}</span><span style="white-space:nowrap;">฿${formatSlipMoney(lineTotal)}</span></div>
${noteLine}
</div>`;
      }
      return `<div style="margin:3px 0;">
<div style="display:flex;justify-content:space-between;gap:4px;font-weight:700;"><span>${escapeSlipHtml(it.name)}</span><span style="white-space:nowrap;">× ${qty}</span></div>
${noteLine}
</div>`;
    })
    .join("");

  const grand =
    typeof params.grandTotal === "number" && Number.isFinite(params.grandTotal) ?
      params.grandTotal
    : computedTotal;

  const totalBlock =
    showPrices ?
      `<div style="margin-top:10px;padding:8px;background:#f8fafc;border-radius:8px;text-align:center;">
<p style="margin:0;font-size:0.85em;color:#475569;">ยอดรวม (บาท)</p>
<p class="total-big" style="margin:4px 0 0;">${formatSlipMoney(grand)}</p>
</div>`
    : "";

  const noteBlock =
    note ?
      `<p style="margin:10px 0 0;padding-top:8px;border-top:1px dashed #cbd5e1;"><strong>หมายเหตุ</strong> ${escapeSlipHtml(note)}</p>`
    : "";

  const footerBlock =
    footer ?
      `<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">${escapeSlipHtml(footer)}</p>`
    : variant === "kitchen" ?
      `<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">ส่งที่โต๊ะลูกค้า</p>`
    : `<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">ขอบคุณที่ใช้บริการ</p>`;

  return `
${logoBlock}
${shopBlock}
<p style="margin:0;text-align:center;font-weight:700;color:#0000bf;">${escapeSlipHtml(params.subtitle)}</p>
<p class="table-big" style="margin:8px 0 0;">${escapeSlipHtml(highlight)}</p>
${orderRef}
${customerBlock}
<div style="margin-top:10px;border-top:1px solid #e2e8f0;padding-top:8px;">${lines || `<p style="margin:0;color:#64748b;">ไม่มีรายการ</p>`}</div>
${totalBlock}
${noteBlock}
${footerBlock}
`;
}

export type PrintAppOrderTicketSlipParams = Parameters<typeof buildAppOrderTicketSlipInnerHtml>[0] & {
  /** จากโปรไฟล์ `defaultPaperSize` — ไม่ส่ง = `DEFAULT_APP_SLIP_PAPER_SIZE` */
  paper?: AppSlipPaperSize | string | null;
  documentTitle?: string;
  pageOpts?: AppSlipPrintPageOptions;
};

/** สร้างสลิปออเดอร์แล้วเปิดพิมพ์ทันที */
export function printAppOrderTicketSlip(params: PrintAppOrderTicketSlipParams): boolean {
  const paper = resolveAppSlipPaperSize(params.paper);
  const table = params.tableLabel.trim() || "—";
  const title =
    params.documentTitle?.trim() ||
    (params.variant === "receipt" ? `ใบออเดอร์ โต๊ะ ${table}` : `สลิปครัว โต๊ะ ${table}`);
  const inner = buildAppOrderTicketSlipInnerHtml(params);
  return openAppSlipPrintWindow(paper, inner, title, params.pageOpts);
}

export function alertIfSlipPrintFailed(ok: boolean): void {
  if (ok) return;
  window.alert(
    "ไม่สามารถเปิดหน้าพิมพ์ได้ — ลองอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ หรือรีเฟรชแล้วลองอีกครั้ง",
  );
}

/** แจ้งเมื่อยังไม่ได้แพ็กเหมารายเดือน 199 */
export function alertSlipPrintRequiresMonthlyPlan(): void {
  window.alert(
    "พิมพ์สลิปยังไม่เปิดสำหรับแพ็กเกจของคุณ — สมัครแพ็ก 199 ของโมดูลนี้ หรือติดต่อแอดมินให้เปิดเงื่อนไขพิมพ์สลิป",
  );
}

/**
 * Template กลาง — ใบเสร็จ
 * - SLIP_58: กึ่งกลาง (สลิปความร้อน)
 * - SLIP_80 / A4: ชิดซ้ายแบบใบเสร็จทางการ (โลโก้+ข้อมูลร้าน / หัวเอกสารขวา · ตารางรายการ · ลายเซ็น)
 * โมดูล map ข้อมูลมาที่นี่ — ห้ามคัดลอก HTML ใบเสร็จในโมดูลย่อย
 */
export type AppReceiptSlipBuildParams = {
  shopLabel?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  /** ค่าเริ่มต้น: ใบเสร็จรับเงิน */
  subtitle?: string | null;
  /** เช่น Original */
  copyLabel?: string | null;
  orderRef?: string | number | null;
  printedAt: string;
  customerName?: string | null;
  /** ที่อยู่ลูกค้า (ใบกำกับภาษี / เอกสาร A4) */
  customerAddress?: string | null;
  /** เลขผู้เสียภาษีลูกค้า */
  customerTaxId?: string | null;
  paymentMethodLabel?: string | null;
  /** @deprecated ไม่แสดงบนใบเสร็จ — คงไว้เพื่อความเข้ากันได้ของ API */
  paymentNote?: string | null;
  /** ป้ายลายเซ็นฝั่งผู้รับเงิน */
  signerShopLabel?: string | null;
  /** ป้ายลายเซ็นฝั่งผู้รับบริการ (เช่นชื่อลูกค้า) */
  signerCustomerLabel?: string | null;
  items: AppSlipLineItem[];
  grandTotal?: number | null;
  footerNote?: string | null;
  /** กำหนดเลย์เอาต์ — 58 กึ่งกลาง · 80/A4 ชิดซ้าย */
  paper?: AppSlipPaperSize | string | null;
};

function buildAppReceiptSlipCenteredHtml(params: AppReceiptSlipBuildParams): string {
  const shop = params.shopLabel?.trim() || "";
  const logoUrl = params.logoUrl?.trim() || "";
  const address = params.address?.trim() || "";
  const taxId = params.taxId?.trim() || "";
  const phone = params.contactPhone?.trim() || "";
  const subtitle = params.subtitle?.trim() || "ใบเสร็จรับเงิน";
  const customer = params.customerName?.trim() || "";
  const payLabel = params.paymentMethodLabel?.trim() || "";
  const footer = params.footerNote?.trim() || "ขอบคุณที่ใช้บริการ";

  const logoBlock =
    logoUrl ?
      `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeSlipHtml(logoUrl)}" alt="" style="max-height:48px;max-width:120px;object-fit:contain;border-radius:999px;" /></div>`
    : "";

  const shopBlock = shop ? `<h1>${escapeSlipHtml(shop)}</h1>` : "";

  const metaLines: string[] = [];
  if (address) {
    metaLines.push(
      `<p style="margin:2px 0;text-align:center;color:#334155;font-size:0.9em;white-space:pre-wrap;">${escapeSlipHtml(address)}</p>`,
    );
  }
  if (phone) {
    metaLines.push(
      `<p style="margin:2px 0;text-align:center;color:#334155;font-size:0.9em;">โทร. ${escapeSlipHtml(phone)}</p>`,
    );
  }
  if (taxId) {
    metaLines.push(
      `<p style="margin:2px 0;text-align:center;color:#334155;font-size:0.9em;">เลขประจำตัวผู้เสียภาษี ${escapeSlipHtml(taxId)}</p>`,
    );
  }

  const orderRef =
    params.orderRef != null && String(params.orderRef).trim() ?
      `<p style="margin:6px 0 0;text-align:center;color:#64748b;font-size:0.85em;">เลขที่ ${escapeSlipHtml(String(params.orderRef))} · ${escapeSlipHtml(formatSlipPrintedAt(params.printedAt))}</p>`
    : `<p style="margin:6px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeSlipHtml(formatSlipPrintedAt(params.printedAt))}</p>`;

  const customerBlock =
    customer ?
      `<p style="margin:4px 0 0;text-align:center;font-weight:600;">ลูกค้า ${escapeSlipHtml(customer)}</p>`
    : "";

  let computedTotal = 0;
  const lines = params.items
    .map((it) => {
      const qty = Math.max(0, Number(it.qty) || 0);
      const unit = typeof it.unitPrice === "number" && Number.isFinite(it.unitPrice) ? it.unitPrice : null;
      const discount =
        typeof it.discount === "number" && Number.isFinite(it.discount) ? Math.max(0, it.discount) : 0;
      const lineTotal = unit != null ? Math.max(0, unit * qty - discount) : null;
      if (lineTotal != null) computedTotal += lineTotal;
      const noteLine =
        it.note?.trim() ?
          `<div style="margin:0 0 2px 0;color:#64748b;font-size:0.85em;">↳ ${escapeSlipHtml(it.note.trim())}</div>`
        : "";
      if (lineTotal != null) {
        return `<div style="margin:4px 0;text-align:left;">
<div style="display:flex;justify-content:space-between;gap:6px;align-items:flex-start;">
<span style="flex:1;min-width:0;">${escapeSlipHtml(it.name)} × ${qty}</span>
<span style="white-space:nowrap;font-weight:700;">฿${formatSlipMoney(lineTotal)}</span>
</div>
${noteLine}
</div>`;
      }
      return `<div style="margin:4px 0;text-align:left;">
<div style="display:flex;justify-content:space-between;gap:6px;font-weight:700;"><span>${escapeSlipHtml(it.name)}</span><span>× ${qty}</span></div>
${noteLine}
</div>`;
    })
    .join("");

  const grand =
    typeof params.grandTotal === "number" && Number.isFinite(params.grandTotal) ?
      params.grandTotal
    : computedTotal;

  const payBlock =
    payLabel ?
      `<p style="margin:8px 0 0;text-align:center;font-size:0.9em;color:#475569;">ชำระโดย ${escapeSlipHtml(payLabel)}</p>`
    : "";

  return `
${logoBlock}
${shopBlock}
${metaLines.join("")}
<div style="margin:10px 0 0;padding-top:8px;border-top:1px dashed #cbd5e1;">
<p style="margin:0;text-align:center;font-weight:800;color:#0000bf;">${escapeSlipHtml(subtitle)}</p>
${orderRef}
${customerBlock}
</div>
<div style="margin-top:10px;border-top:1px solid #e2e8f0;padding-top:8px;">${lines || `<p style="margin:0;color:#64748b;">ไม่มีรายการ</p>`}</div>
<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #cbd5e1;text-align:left;">
<div style="display:flex;justify-content:space-between;gap:6px;align-items:baseline;font-weight:800;">
<span style="flex:1;min-width:0;">ยอดรวม (บาท)</span>
<span style="white-space:nowrap;">฿${formatSlipMoney(grand)}</span>
</div>
</div>
${payBlock}
<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">${escapeSlipHtml(footer)}</p>
`;
}

function buildAppReceiptSlipFormalLeftHtml(params: AppReceiptSlipBuildParams): string {
  const shop = params.shopLabel?.trim() || "";
  const logoUrl = params.logoUrl?.trim() || "";
  const address = params.address?.trim() || "";
  const taxId = params.taxId?.trim() || "";
  const phone = params.contactPhone?.trim() || "";
  const email = params.contactEmail?.trim() || "";
  const subtitle = params.subtitle?.trim() || "ใบเสร็จรับเงิน";
  const copyLabel = params.copyLabel?.trim() || "Original";
  const customer = params.customerName?.trim() || "";
  const customerAddress = params.customerAddress?.trim() || "";
  const customerTaxId = params.customerTaxId?.trim() || "";
  const payLabel = params.paymentMethodLabel?.trim() || "";
  const signer = params.signerShopLabel?.trim() || shop || "ผู้รับเงิน";
  const customerSigner = params.signerCustomerLabel?.trim() || customer;
  const footer = params.footerNote?.trim() || "";
  const orderRef =
    params.orderRef != null && String(params.orderRef).trim() ? String(params.orderRef).trim() : "—";
  const printed = formatSlipPrintedAt(params.printedAt);

  const logoImg =
    logoUrl ?
      `<img src="${escapeSlipHtml(logoUrl)}" alt="" style="width:52px;height:52px;object-fit:contain;border-radius:999px;border:1px solid #e2e8f0;" />`
    : `<div style="width:52px;height:52px;border-radius:999px;background:#eef2ff;border:1px solid #c7d2fe;"></div>`;

  const contactBits: string[] = [];
  if (phone) contactBits.push(phone);
  if (email) contactBits.push(`Email: ${email}`);
  const contactLine = contactBits.length ? contactBits.join(" | ") : "";

  let computedTotal = 0;
  const rows = params.items
    .map((it, idx) => {
      const qty = Math.max(0, Number(it.qty) || 0);
      const unit = typeof it.unitPrice === "number" && Number.isFinite(it.unitPrice) ? it.unitPrice : 0;
      const discount =
        typeof it.discount === "number" && Number.isFinite(it.discount) ? Math.max(0, it.discount) : 0;
      const net = Math.max(0, unit * qty - discount);
      computedTotal += net;
      const detail = it.note?.trim() ? `${it.name} — ${it.note.trim()}` : it.name;
      return `<tr>
<td style="text-align:center;">${idx + 1}</td>
<td style="text-align:left;">${escapeSlipHtml(detail)}</td>
<td style="text-align:center;">${qty}</td>
<td style="text-align:right;">${formatSlipMoney(unit)}</td>
<td style="text-align:right;">${formatSlipMoney(discount)}</td>
<td style="text-align:right;">${formatSlipMoney(net)}</td>
</tr>`;
    })
    .join("");

  const grand =
    typeof params.grandTotal === "number" && Number.isFinite(params.grandTotal) ?
      params.grandTotal
    : computedTotal;

  const customerExtraLines: string[] = [];
  if (customerTaxId) {
    customerExtraLines.push(
      `<p style="margin:2px 0 0;font-size:0.9em;">เลขประจำตัวผู้เสียภาษี: ${escapeSlipHtml(customerTaxId)}</p>`,
    );
  }
  if (customerAddress) {
    customerExtraLines.push(
      `<p style="margin:2px 0 0;font-size:0.9em;white-space:pre-wrap;">ที่อยู่: ${escapeSlipHtml(customerAddress)}</p>`,
    );
  }
  const customerBlock =
    customer || customerTaxId || customerAddress
      ? `<div style="margin:10px 0 0;">
${customer ? `<p style="margin:0;"><span style="font-weight:600;">ชื่อลูกค้า / โครงการ:</span> <strong>${escapeSlipHtml(customer)}</strong></p>` : ""}
${customerExtraLines.join("")}
</div>`
      : "";

  const payMethod =
    payLabel ?
      `<p style="margin:6px 0 0;font-size:0.9em;color:#475569;">ชำระโดย ${escapeSlipHtml(payLabel)}</p>`
    : "";

  const footerBlock =
    footer ?
      `<p style="margin:10px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeSlipHtml(footer)}</p>`
    : "";

  return `
<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
  <div style="display:flex;gap:8px;align-items:flex-start;min-width:0;flex:1;">
    <div style="flex-shrink:0;">${logoImg}</div>
    <div style="min-width:0;">
      ${shop ? `<h1 style="margin:0;">${escapeSlipHtml(shop)}</h1>` : ""}
      ${taxId ? `<p style="margin:2px 0;font-size:0.9em;">เลขประจำตัวผู้เสียภาษี: ${escapeSlipHtml(taxId)}</p>` : ""}
      ${address ? `<p style="margin:2px 0;font-size:0.9em;white-space:pre-wrap;">ที่อยู่: ${escapeSlipHtml(address)}</p>` : ""}
      ${contactLine ? `<p style="margin:2px 0;font-size:0.9em;">ติดต่อ: ${escapeSlipHtml(contactLine)}</p>` : ""}
    </div>
  </div>
  <div style="flex-shrink:0;text-align:right;min-width:7.5em;">
    <p style="margin:0;font-size:1.15em;font-weight:900;text-decoration:underline;">${escapeSlipHtml(subtitle)}</p>
    <p style="margin:4px 0 0;font-size:0.85em;">${escapeSlipHtml(copyLabel)}</p>
    <p style="margin:8px 0 0;font-size:0.9em;">เลขที่: ${escapeSlipHtml(orderRef)}</p>
    <p style="margin:2px 0 0;font-size:0.9em;">วันที่: ${escapeSlipHtml(printed)}</p>
  </div>
</div>
${customerBlock}
<table class="receipt-table">
<thead>
<tr>
<th style="width:2.2em;">ลำดับ</th>
<th>รายการสินค้า / รายละเอียด</th>
<th style="width:3em;">จำนวน</th>
<th style="width:4.2em;">หน่วยละ</th>
<th style="width:3.5em;">ส่วนลด</th>
<th style="width:4.5em;">ราคาสุทธิ</th>
</tr>
</thead>
<tbody>
${rows || `<tr><td colspan="6" style="text-align:center;color:#64748b;">ไม่มีรายการ</td></tr>`}
<tr>
<td colspan="5" style="text-align:left;font-weight:800;">ยอดเงินรวมสุทธิทั้งสิ้น (Grand Total)</td>
<td style="text-align:right;font-weight:900;">฿ ${formatSlipMoney(grand)}</td>
</tr>
</tbody>
</table>
${payMethod}
${footerBlock}
<div style="display:flex;justify-content:space-between;gap:16px;margin-top:28px;padding:0 4px;">
  <div style="flex:1;text-align:center;">
    <div style="border-bottom:1px dotted #64748b;min-height:28px;margin-bottom:6px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;font-weight:700;">
      ${customerSigner ? escapeSlipHtml(customerSigner) : "&nbsp;"}
    </div>
    <p style="margin:0;font-size:0.85em;">( ผู้รับบริการ )</p>
  </div>
  <div style="flex:1;text-align:center;">
    <div style="border-bottom:1px dotted #64748b;min-height:28px;margin-bottom:6px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;font-weight:700;">
      ${signer ? escapeSlipHtml(signer) : "&nbsp;"}
    </div>
    <p style="margin:0;font-size:0.85em;">( ผู้รับเงิน )</p>
  </div>
</div>
`;
}

export function buildAppReceiptSlipInnerHtml(params: AppReceiptSlipBuildParams): string {
  const paper = resolveAppSlipPaperSize(params.paper);
  if (paper === "SLIP_58") return buildAppReceiptSlipCenteredHtml(params);
  return buildAppReceiptSlipFormalLeftHtml(params);
}

/** @deprecated ใช้ `buildAppReceiptSlipInnerHtml` */
export const buildAppShortReceiptSlipInnerHtml = buildAppReceiptSlipInnerHtml;

export type PrintAppReceiptSlipParams = AppReceiptSlipBuildParams & {
  /** จากตั้งค่าโมดูล — ไม่ส่ง = `DEFAULT_APP_SLIP_PAPER_SIZE` */
  paper?: AppSlipPaperSize | string | null;
  documentTitle?: string;
  pageOpts?: AppSlipPrintPageOptions;
};

/** @deprecated ใช้ `PrintAppReceiptSlipParams` */
export type PrintAppShortReceiptSlipParams = PrintAppReceiptSlipParams;

/** พิมพ์ใบเสร็จกลางทันที — เลย์เอาต์ตามขนาดกระดาษของโมดูล */
export function printAppReceiptSlip(params: PrintAppReceiptSlipParams): boolean {
  const paper = resolveAppSlipPaperSize(params.paper);
  const ref = params.orderRef != null ? String(params.orderRef).trim() : "";
  const title =
    params.documentTitle?.trim() ||
    (ref ? `ใบเสร็จ ${ref}` : "ใบเสร็จรับเงิน");
  const inner = buildAppReceiptSlipInnerHtml({ ...params, paper });
  return openAppSlipPrintWindow(paper, inner, title, params.pageOpts);
}

/** @deprecated ใช้ `printAppReceiptSlip` */
export function printAppShortReceiptSlip(params: PrintAppReceiptSlipParams): boolean {
  return printAppReceiptSlip(params);
}

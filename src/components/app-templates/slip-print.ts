import { printPrintableHtmlInHiddenIframe } from "@/components/app-templates/openPrintableHtml";

/** ขนาดกระดาษสลิป/บิล — ใช้ร่วมทุกโมดูล */
export type AppSlipPaperSize = "SLIP_58" | "SLIP_80" | "A4";

export type AppSlipPrintPageOptions = {
  /** A4: ลด margin แนวตั้งเพื่อตัดพื้นที่ว่างบน-ล่างตอนพิมพ์ */
  a4TightVerticalMargins?: boolean;
};

export type AppSlipLineItem = {
  name: string;
  qty: number;
  /** ราคาต่อหน่วย — แสดงเมื่อ showPrices */
  unitPrice?: number;
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
    const v = tight ? "5mm" : "12mm";
    const h = tight ? "10mm" : "12mm";
    return `
@page { size: A4 portrait; margin: ${v} ${h}; }
body { margin: 0; font-family: system-ui, "Segoe UI", sans-serif; color: #0f172a; background: #fff; }
.root { max-width: 180mm; margin: 0 auto; font-size: 12px; line-height: 1.4; }
h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
h2 { font-size: 0.85rem; margin: 0.75rem 0 0.35rem; }
.total-big { font-size: 1.75rem; font-weight: 800; color: #0000bf; }
.table-big { font-size: 1.85rem; font-weight: 900; text-align: center; letter-spacing: 0.02em; }
.qr-wrap { text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: 200px; height: 200px; object-fit: contain; }
`;
  }
  const w = paper === "SLIP_80" ? "80mm" : "58mm";
  const inner = paper === "SLIP_80" ? "74mm" : "52mm";
  const fs = paper === "SLIP_80" ? "11px" : "9px";
  const qr = paper === "SLIP_80" ? "160px" : "120px";
  const tableFs = paper === "SLIP_80" ? "1.55em" : "1.45em";
  return `
@page { size: ${w} auto; margin: 2mm; }
body { margin: 0; font-family: system-ui, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: ${fs}; line-height: 1.35; }
.root { width: ${inner}; max-width: 100%; margin: 0 auto; box-sizing: border-box; }
h1 { font-size: 1.1em; margin: 0 0 0.15rem; text-align: center; }
h2 { font-size: 0.95em; margin: 0.5rem 0 0.2rem; }
.total-big { font-size: 1.35em; font-weight: 800; color: #0000bf; text-align: center; }
.table-big { font-size: ${tableFs}; font-weight: 900; text-align: center; letter-spacing: 0.02em; }
.qr-wrap { text-align: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: ${qr}; height: ${qr}; object-fit: contain; }
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
  const safeTitle = escapeDocTitle(documentTitle);
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
  const safeTitle = escapeDocTitle(documentTitle);
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
  paper?: AppSlipPaperSize;
  documentTitle?: string;
  pageOpts?: AppSlipPrintPageOptions;
};

/** สร้างสลิปออเดอร์แล้วเปิดพิมพ์ทันที */
export function printAppOrderTicketSlip(params: PrintAppOrderTicketSlipParams): boolean {
  const paper = params.paper ?? "SLIP_80";
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
    "พิมพ์สลิปยังไม่เปิดสำหรับแพ็กเกจของคุณ — อัปเกรดแพ็กเหมารายเดือน 199 หรือติดต่อแอดมินให้เปิดเงื่อนไขพิมพ์สลิป",
  );
}

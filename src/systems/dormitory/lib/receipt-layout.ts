export type DormReceiptLayout = "slip58" | "slip80" | "a4";

/** ค่า defaultPaperSize จาก DormitoryProfile: SLIP_58 | SLIP_80 | A4 */
export function resolveDormReceiptLayout(
  w: string | null | undefined,
  format: string | null | undefined,
  profileDefault: string,
): DormReceiptLayout {
  const f = (format ?? "").trim().toUpperCase().replace(/-/g, "_");
  if (f === "A4") return "a4";
  if (f === "SLIP_80" || f === "SLIP80") return "slip80";
  if (f === "SLIP_58" || f === "SLIP58") return "slip58";
  const ww = (w ?? "").trim();
  if (ww === "80") return "slip80";
  if (ww === "58") return "slip58";
  if (ww.toLowerCase() === "a4") return "a4";
  const d = (profileDefault ?? "SLIP_58").toUpperCase();
  if (d === "SLIP_80") return "slip80";
  if (d === "A4") return "a4";
  return "slip58";
}

export function receiptLayoutPrintCss(layout: DormReceiptLayout): string {
  if (layout === "a4") {
    return `
  #dorm-receipt-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 297mm;
    padding: 14mm 16mm;
    box-sizing: border-box;
  }
`;
  }
  const w = layout === "slip80" ? "80mm" : "58mm";
  return `
  #dorm-receipt-root {
    position: absolute;
    left: 0;
    top: 0;
    width: ${w};
    max-width: 100%;
    padding: 4mm;
    box-sizing: border-box;
  }
`;
}

"use client";

/** สไตล์พิมพ์เฉพาะ #dorm-invoice-root — ใช้ทั้งหน้าใบแจ้งหนี้และโมดัลห้อง */
export function DormInvoicePrintStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@media print {
  body * { visibility: hidden !important; }
  #dorm-invoice-root, #dorm-invoice-root * { visibility: visible !important; }
  #dorm-invoice-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 297mm;
    padding: 12mm 14mm;
    box-sizing: border-box;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  .no-print { display: none !important; }
}
`,
      }}
    />
  );
}

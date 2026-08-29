/** ค่า/ชนิดใบแจ้งหนี้หมู่บ้าน — ปลอดภัยสำหรับ client (ไม่มี Prisma / Node builtins) */

export const VILLAGE_INVOICE_FALLBACK_NAME = "โครงการหมู่บ้าน";

/** สถานะบิลค่าส่วนกลางที่ยังออกใบแจ้งหนี้ / แนบสลิปได้ */
export const VILLAGE_UNPAID_FEE_STATUSES = ["PENDING", "PARTIAL"] as const;

export type VillageInvoiceSheetDto = {
  feeRowId: number;
  houseId: number;
  villageName: string;
  address: string | null;
  contactPhone: string | null;
  taxId: string | null;
  defaultPaperSize: string;
  houseNo: string;
  residentName: string;
  residentPhone: string;
  periodMonth: string;
  amountDue: number;
  amountPaid: number;
  /** ยอดคงเหลือที่ต้องชำระ */
  amount: number;
  paymentChannelsNote: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
  uploadPagePath: string;
  uploadPageAbs: string;
};

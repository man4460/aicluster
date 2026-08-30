import { appPaymentMethodLabel, printAppReceiptSlip } from "@/components/app-templates";

export type ParkingReceiptInput = {
  sessionId: number;
  shopName?: string | null;
  licensePlate: string;
  spotCode?: string | null;
  amountPaidBaht: number;
  paymentMethod?: string | null;
  printedAt?: string;
};

export function printParkingReceipt(data: ParkingReceiptInput): boolean {
  return printAppReceiptSlip({
    shopLabel: data.shopName?.trim() || "บริการรับฝากจอดรถ",
    subtitle: "ใบเสร็จค่าจอดรถ",
    orderRef: `P-${data.sessionId}`,
    printedAt: data.printedAt ?? new Date().toISOString(),
    paymentMethodLabel: appPaymentMethodLabel(data.paymentMethod),
    items: [
      {
        name: `ค่าจอดรถ ทะเบียน ${data.licensePlate}${data.spotCode ? ` · ช่อง ${data.spotCode}` : ""}`,
        qty: 1,
        unitPrice: data.amountPaidBaht,
      },
    ],
    grandTotal: data.amountPaidBaht,
    footerNote: "ขอบคุณที่ใช้บริการ",
  });
}

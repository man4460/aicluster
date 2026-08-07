import {
  alertIfSlipPrintFailed,
  printAppOrderTicketSlip,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import type { DrinkPosOrderBoardRow } from "@/systems/drink-pos/lib/order-board";

/** พิมพ์สลิปคิวเครื่องดื่มจากระบบสลิปกลาง */
export function printDrinkPosOrderTicket(
  order: DrinkPosOrderBoardRow,
  opts?: { paper?: AppSlipPaperSize; shopLabel?: string | null },
): boolean {
  const shortId = order.id.slice(-6).toUpperCase();
  const ok = printAppOrderTicketSlip({
    shopLabel: opts?.shopLabel,
    subtitle: "สลิปครัว · เครื่องดื่ม",
    tableLabel: shortId,
    highlightLabel: `คิว ${shortId}`,
    orderRef: shortId,
    customerName: order.memberPhone ? `ลูกค้า ${order.memberPhone}` : null,
    note: order.note,
    printedAt: order.createdAt,
    items: order.lines.map((l) => ({
      name: l.sizeLabel ? `${l.productName} (${l.sizeLabel})` : l.productName,
      qty: l.quantity,
    })),
    variant: "kitchen",
    grandTotal: order.totalBaht,
    paper: opts?.paper ?? "SLIP_80",
    footerNote: order.isRewardRedemption ? "แลกคะแนน" : "พร้อมเสิร์ฟ",
    documentTitle: `สลิปเครื่องดื่ม ${shortId}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

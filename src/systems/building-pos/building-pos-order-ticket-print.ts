import {
  alertIfSlipPrintFailed,
  printAppOrderTicketSlip,
  resolveAppSlipPaperSize,
  type AppOrderTicketSlipVariant,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import type { PosOrder } from "@/systems/building-pos/building-pos-service";

export type BuildingPosOrderTicketPrintOpts = {
  shopLabel?: string | null;
  logoUrl?: string | null;
  /** จากโปรไฟล์ `defaultPaperSize` — ไม่ส่ง = SLIP_58 */
  paper?: AppSlipPaperSize | string | null;
  /** kitchen = สลิปส่งโต๊ะ · receipt = มีราคา */
  variant?: AppOrderTicketSlipVariant;
  subtitle?: string;
};

/** พิมพ์สลิปออเดอร์หนึ่งใบ (ครัว / แดชบอร์ด / หลังสั่ง) */
export function printBuildingPosOrderTicket(
  order: PosOrder,
  opts: BuildingPosOrderTicketPrintOpts = {},
): boolean {
  const variant = opts.variant ?? "kitchen";
  const subtitle =
    opts.subtitle?.trim() ||
    (variant === "receipt" ? "ใบออเดอร์" : "สลิปครัว · ส่งโต๊ะ");
  const ok = printAppOrderTicketSlip({
    shopLabel: opts.shopLabel,
    logoUrl: opts.logoUrl,
    subtitle,
    tableLabel: order.table_no,
    orderRef: order.id,
    customerName: order.customer_name,
    note: order.note,
    printedAt: order.created_at || new Date().toISOString(),
    items: order.items.map((it) => ({
      name: it.name,
      qty: it.qty,
      unitPrice: it.price,
      note: it.note,
    })),
    variant,
    grandTotal: order.total_amount,
    paper: resolveAppSlipPaperSize(opts.paper),
    footerNote: variant === "kitchen" ? "ส่งที่โต๊ะลูกค้า" : "ขอบคุณที่ใช้บริการ",
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

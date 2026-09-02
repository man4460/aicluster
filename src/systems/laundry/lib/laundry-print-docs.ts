import { printAppReceiptSlip, resolveAppSlipPaperSize } from "@/components/app-templates/slip-print";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { laundryPaymentMethodLabel } from "@/systems/laundry/lib/payment-method";
import type { LaundryOrder } from "@/systems/laundry/laundry-service";

export type LaundryPrintShopProfile = {
  displayName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  slipPaperSize?: string | null;
};

export function printLaundryOrderDocs(opts: {
  order: LaundryOrder;
  shop: LaundryPrintShopProfile;
  receipt?: boolean;
  workTicket?: boolean;
}): void {
  const { order, shop } = opts;
  const shopLabel = shop.displayName?.trim() || "รับฝากซักผ้า";
  const paper = resolveAppSlipPaperSize(shop.slipPaperSize);
  const price = Math.max(0, Math.round(order.final_price ?? 0));
  const serviceLabel = order.service_type?.trim() || order.package_name?.trim() || "บริการซักผ้า";
  const when = order.order_at ? formatBangkokDateTimeLong(order.order_at) : undefined;

  if (opts.receipt !== false && price > 0) {
    printAppReceiptSlip({
      shopLabel,
      logoUrl: shop.logoUrl,
      address: shop.address,
      taxId: shop.taxId,
      contactPhone: shop.contactPhone,
      orderRef: order.id ? `#${order.id}` : undefined,
      printedAt: new Date().toISOString(),
      customerName: order.customer_name?.trim() || "ลูกค้า",
      paymentMethodLabel: laundryPaymentMethodLabel(order.payment_method),
      items: [
        {
          name: serviceLabel,
          qty: 1,
          unitPrice: price,
          note: [when, order.customer_phone?.trim()].filter(Boolean).join(" · "),
        },
      ],
      grandTotal: price,
      signerCustomerLabel: order.customer_name?.trim() || "ลูกค้า",
      signerShopLabel: shopLabel,
      paper,
      documentTitle: "ใบเสร็จรับเงิน",
    });
  }

  if (opts.workTicket) {
    printAppReceiptSlip({
      shopLabel,
      logoUrl: shop.logoUrl,
      orderRef: order.id ? `#${order.id}` : undefined,
      printedAt: new Date().toISOString(),
      customerName: order.customer_name?.trim() || "ลูกค้า",
      items: [
        {
          name: serviceLabel,
          qty: 1,
          unitPrice: price,
          note: [order.note?.trim(), order.pickup_address?.trim()].filter(Boolean).join(" · "),
        },
      ],
      grandTotal: price,
      signerShopLabel: shopLabel,
      paper,
      documentTitle: "สลิปงานซักผ้า",
      footerNote: order.status ? `สถานะ: ${order.status}` : undefined,
    });
  }
}

/** ช่องทางขายร้านออนไลน์ */
export const ECOMMERCE_SALES_CHANNELS = ["ONLINE", "IN_STORE"] as const;
export type EcommerceSalesChannel = (typeof ECOMMERCE_SALES_CHANNELS)[number];

export function ecommerceSalesChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "IN_STORE":
      return "หน้าร้าน";
    case "ONLINE":
    default:
      return "ออนไลน์";
  }
}

export {
  ECOMMERCE_POS_PAYMENT_METHODS,
  ecommercePosPaymentMethodLabel,
  ecommercePosPaymentRequiresSlip,
  ecommercePosPaymentShowsSlip,
  ecommercePosPaymentShowsSlipUpload,
  isEcommercePosPaymentMethod,
  type EcommercePosPaymentMethod,
} from "@/systems/ecommerce-store/lib/payment-method";
